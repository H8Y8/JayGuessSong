'use client';

import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
    const router = useRouter();

    return (
        <div className="min-h-screen py-12 px-6">
            <div className="max-w-3xl mx-auto">
                {/* 返回按鈕 */}
                <button
                    onClick={() => router.back()}
                    className="mb-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    <span>←</span>
                    <span>返回</span>
                </button>

                {/* 標題 */}
                <h1 className="text-3xl md:text-4xl font-bold text-blue-400 mb-8">
                    隱私權政策
                </h1>

                {/* 更新日期 */}
                <p className="text-gray-500 text-sm mb-8">
                    最後更新日期：2026 年 1 月 1 日
                </p>

                {/* 內容 */}
                <div className="space-y-8 text-gray-300">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. 前言</h2>
                        <p className="leading-relaxed">
                            歡迎使用「周杰倫猜歌挑戰」（以下簡稱「本服務」）。我們非常重視您的隱私權，本隱私權政策旨在說明我們如何收集、使用、保護及處理您的個人資料。使用本服務即表示您同意本政策的條款。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. 資料收集</h2>
                        <p className="leading-relaxed mb-4">我們可能收集以下類型的資料：</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>
                                <strong>暱稱：</strong>您自願提供的遊戲暱稱，用於排行榜顯示。此為選填項目，您可以選擇匿名遊玩。
                            </li>
                            <li>
                                <strong>遊戲記錄：</strong>您的遊戲分數、答題記錄及遊玩時間等資料。
                            </li>
                            <li>
                                <strong>技術資訊：</strong>包括但不限於 IP 位址、瀏覽器類型、裝置資訊等，用於改善服務品質。
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. 資料使用</h2>
                        <p className="leading-relaxed mb-4">我們收集的資料將用於：</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>提供、維護及改善本服務</li>
                            <li>顯示排行榜及遊戲統計</li>
                            <li>分析服務使用情況以優化使用者體驗</li>
                            <li>確保服務安全及防止濫用</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. 資料儲存與安全</h2>
                        <p className="leading-relaxed">
                            您的資料儲存於安全的雲端資料庫中，我們採取適當的技術及組織措施來保護您的資料免受未經授權的存取、使用或揭露。然而，請注意網路傳輸沒有任何方法是 100% 安全的。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. 第三方服務</h2>
                        <p className="leading-relaxed">
                            本服務使用 YouTube 內嵌播放器播放音樂內容。當您使用本服務時，YouTube 可能會根據其隱私權政策收集某些資料。我們建議您查閱
                            <a
                                href="https://policies.google.com/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline ml-1"
                            >
                                Google 隱私權政策
                            </a>
                            以了解更多資訊。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Cookie 使用</h2>
                        <p className="leading-relaxed">
                            本服務可能使用 Cookie 及類似技術來儲存遊戲狀態和提升使用者體驗。您可以透過瀏覽器設定管理 Cookie 偏好，但這可能影響部分功能的正常運作。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">7. 您的權利</h2>
                        <p className="leading-relaxed mb-4">根據適用法律，您可能擁有以下權利：</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>查詢及存取您的個人資料</li>
                            <li>要求更正不正確的資料</li>
                            <li>要求刪除您的資料</li>
                            <li>反對或限制資料處理</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">8. 兒童隱私</h2>
                        <p className="leading-relaxed">
                            本服務不針對 13 歲以下兒童。我們不會故意收集 13 歲以下兒童的個人資料。如果您是家長或監護人，並發現您的孩子向我們提供了個人資料，請與我們聯繫。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">9. 政策變更</h2>
                        <p className="leading-relaxed">
                            我們可能會不時更新本隱私權政策。任何變更將在本頁面發布，並更新「最後更新日期」。我們建議您定期查閱本政策以了解最新資訊。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">10. 聯絡我們</h2>
                        <p className="leading-relaxed">
                            如果您對本隱私權政策有任何疑問或意見，請透過以下方式與我們聯繫。我們將盡力在合理時間內回覆您的詢問。
                        </p>
                    </section>
                </div>

                {/* 底部導航 */}
                <div className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap gap-4 text-sm">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        首頁
                    </button>
                    <span className="text-gray-700">•</span>
                    <button
                        onClick={() => router.push('/terms')}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        使用條款
                    </button>
                    <span className="text-gray-700">•</span>
                    <button
                        onClick={() => router.push('/leaderboard')}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        排行榜
                    </button>
                </div>
            </div>
        </div>
    );
}
