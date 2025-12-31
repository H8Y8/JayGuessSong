#!/usr/bin/env python3
"""
Download the list of songs in a YouTube playlist and store them in a CSV file.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import deque
from pathlib import Path
from typing import Deque, Dict, Iterable, List, Tuple
from urllib.parse import parse_qs, urlparse

import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


def fetch_html(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()
    return response.text


def extract_initial_data(html: str) -> Dict:
    patterns = [
        r"ytInitialData\"?\s*:\s*(\{.+?\})\s*;\s*</script",
        r"var ytInitialData\s*=\s*(\{.+?\});",
    ]
    for pattern in patterns:
        match = re.search(pattern, html, flags=re.DOTALL)
        if match:
            return json.loads(match.group(1))
    raise RuntimeError("Could not locate ytInitialData in the playlist page.")


def extract_ytcfg(html: str) -> Dict:
    matches = re.finditer(r"ytcfg\.set\(({.+?})\);", html, flags=re.DOTALL)
    for match in matches:
        data = json.loads(match.group(1))
        if "INNERTUBE_API_KEY" in data:
            return data
    raise RuntimeError("Could not locate YouTube configuration in the playlist page.")


def find_playlist_renderer(initial_data: Dict) -> Dict:
    tabs = (
        initial_data.get("contents", {})
        .get("twoColumnBrowseResultsRenderer", {})
        .get("tabs", [])
    )
    for tab in tabs:
        tab_renderer = tab.get("tabRenderer") or {}
        contents = (
            tab_renderer.get("content", {})
            .get("sectionListRenderer", {})
            .get("contents", [])
        )
        for section in contents:
            item_section = section.get("itemSectionRenderer") or {}
            for item in item_section.get("contents", []):
                playlist_renderer = item.get("playlistVideoListRenderer")
                if playlist_renderer:
                    return playlist_renderer
    raise RuntimeError("Could not find playlist video renderer in initial data.")


def extract_playlist_id(url: str) -> str:
    parsed = urlparse(url)
    playlist_id = parse_qs(parsed.query).get("list", [None])[0]
    if playlist_id:
        return playlist_id
    if parsed.path.startswith("/playlist/"):
        return parsed.path.rstrip("/").split("/")[-1]
    raise ValueError("The provided URL does not contain a playlist id.")


def extract_tokens_from_endpoint(endpoint: Dict) -> List[str]:
    tokens: List[str] = []
    if not endpoint:
        return tokens
    direct_token = (
        endpoint.get("continuationCommand", {}).get("token")
        or endpoint.get("nextContinuationData", {}).get("continuation")
    )
    if direct_token:
        tokens.append(direct_token)
    executor = endpoint.get("commandExecutorCommand", {})
    for command in executor.get("commands", []):
        token = command.get("continuationCommand", {}).get("token")
        if token:
            tokens.append(token)
    return tokens


def video_entries_from_items(
    items: Iterable[Dict], playlist_id: str
) -> Tuple[List[Dict], List[str]]:
    videos: List[Dict] = []
    tokens: List[str] = []
    for item in items:
        video_renderer = item.get("playlistVideoRenderer")
        if video_renderer:
            video_id = video_renderer.get("videoId")
            if not video_id:
                continue
            title_data = video_renderer.get("title", {})
            if "runs" in title_data:
                title = "".join(run.get("text", "") for run in title_data["runs"])
            else:
                title = title_data.get("simpleText", "")
            url = f"https://www.youtube.com/watch?v={video_id}&list={playlist_id}"
            videos.append({"title": title.strip(), "url": url})
            continue
        continuation = item.get("continuationItemRenderer") or {}
        endpoint = continuation.get("continuationEndpoint", {})
        tokens.extend(extract_tokens_from_endpoint(endpoint))
    return videos, tokens


def fetch_continuation_items(
    token: str, api_key: str, context: Dict
) -> List[Dict]:
    browse_url = f"https://www.youtube.com/youtubei/v1/browse?key={api_key}"
    payload = {"context": context, "continuation": token}
    response = requests.post(
        browse_url,
        headers={**HEADERS, "Content-Type": "application/json"},
        json=payload,
        timeout=15,
    )
    response.raise_for_status()
    data = response.json()
    containers = (
        data.get("onResponseReceivedActions")
        or data.get("onResponseReceivedEndpoints")
        or []
    )
    continuation_items: List[Dict] = []
    for container in containers:
        append_action = container.get("appendContinuationItemsAction") or container.get(
            "reloadContinuationItemsCommand"
        )
        if append_action:
            continuation_items.extend(append_action.get("continuationItems", []))
    return continuation_items


def gather_playlist_entries(url: str) -> List[Dict]:
    html = fetch_html(url)
    initial_data = extract_initial_data(html)
    ytcfg = extract_ytcfg(html)
    playlist_id = extract_playlist_id(url)
    renderer = find_playlist_renderer(initial_data)
    all_videos: List[Dict] = []
    queue: Deque[str] = deque()
    initial_videos, tokens = video_entries_from_items(
        renderer.get("contents", []), playlist_id
    )
    all_videos.extend(initial_videos)
    for token in tokens:
        queue.append(token)

    while queue:
        token = queue.popleft()
        items = fetch_continuation_items(
            token, ytcfg["INNERTUBE_API_KEY"], ytcfg["INNERTUBE_CONTEXT"]
        )
        videos, new_tokens = video_entries_from_items(items, playlist_id)
        all_videos.extend(videos)
        for new_token in new_tokens:
            queue.append(new_token)
    return all_videos


def write_csv(entries: List[Dict], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=["title", "url"])
        writer.writeheader()
        for row in entries:
            writer.writerow(row)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Save all videos from a YouTube playlist into a CSV file.",
    )
    parser.add_argument(
        "playlist_url",
        help="The YouTube playlist URL (e.g. https://www.youtube.com/playlist?list=...)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("playlist.csv"),
        help="Output CSV path (defaults to ./playlist.csv)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    entries = gather_playlist_entries(args.playlist_url)
    if not entries:
        raise SystemExit("No videos were found in the provided playlist.")
    write_csv(entries, args.output)
    print(f"Saved {len(entries)} entries to {args.output}")


if __name__ == "__main__":
    main()
