import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Jay Guess - 周杰倫猜歌挑戰",
  description: "周杰倫猜歌 20 題競速，四選一，越快越高分，挑戰排行榜！",
  keywords: ["周杰倫", "猜歌", "音樂遊戲", "Jay Chou"],
  openGraph: {
    title: "Jay Guess - 周杰倫猜歌挑戰",
    description: "周杰倫猜歌 20 題競速，四選一，越快越高分，挑戰排行榜！",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
