'use client';

import { useRouter } from 'next/navigation';

export default function TermsOfService() {
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
                    使用條款
                </h1>

                {/* 更新日期 */}
                <p className="text-gray-500 text-sm mb-8">
                    最後更新日期：2026 年 1 月 1 日
                </p>

                {/* 內容 */}
                <div className="space-y-8 text-gray-300">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. 條款接受</h2>
                        <p className="leading-relaxed">
                            歡迎使用「周杰倫猜歌挑戰」（以下簡稱「本服務」）。使用本服務即表示您同意遵守本使用條款。如果您不同意這些條款，請勿使用本服務。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. 服務說明</h2>
                        <p className="leading-relaxed">
                            本服務是一個音樂猜謎遊戲，透過 YouTube 內嵌播放器播放音樂片段，讓使用者猜測歌曲名稱。本服務僅供娛樂用途，不涉及任何商業交易或金錢往來。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. 使用規範</h2>
                        <p className="leading-relaxed mb-4">使用本服務時，您同意：</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>不使用任何自動化工具、機器人或腳本操作本服務</li>
                            <li>不嘗試干擾或破壞本服務的正常運作</li>
                            <li>不使用不當、侮辱性或冒犯性的暱稱</li>
                            <li>不從事任何可能損害其他使用者體驗的行為</li>
                            <li>不嘗試逆向工程、反編譯或以其他方式獲取本服務的原始碼</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. 智慧財產權</h2>
                        <p className="leading-relaxed mb-4">
                            本服務中涉及的音樂內容版權歸原版權所有者所有。本服務透過 YouTube 內嵌播放器合法播放音樂內容，不下載、儲存或重新發布任何受版權保護的音樂檔案。
                        </p>
                        <p className="leading-relaxed">
                            「周杰倫」及相關商標為其各自所有者的財產。本服務為非官方粉絲製作的娛樂項目，與周杰倫本人或其唱片公司沒有任何官方關聯或授權。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. 免責聲明</h2>
                        <p className="leading-relaxed mb-4">
                            本服務以「現狀」提供，不提供任何明示或暗示的保證，包括但不限於：
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>服務的不中斷或無錯誤運行</li>
                            <li>服務符合您的特定需求</li>
                            <li>透過本服務獲得的結果之準確性或可靠性</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. 責任限制</h2>
                        <p className="leading-relaxed">
                            在法律允許的最大範圍內，本服務的提供者不對任何直接、間接、附帶、特殊、懲罰性或後果性損害負責，包括但不限於利潤損失、資料遺失或其他無形損失。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">7. 帳戶與資料</h2>
                        <p className="leading-relaxed">
                            本服務不需要註冊帳戶。您提供的暱稱僅用於排行榜顯示。我們保留刪除任何不當暱稱或可疑遊戲記錄的權利，且無需事先通知。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">8. 服務變更</h2>
                        <p className="leading-relaxed">
                            我們保留隨時修改、暫停或終止本服務（或其任何部分）的權利，且無需事先通知。對於服務的任何修改、暫停或終止，我們不對您或任何第三方承擔責任。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">9. 條款變更</h2>
                        <p className="leading-relaxed">
                            我們可能會不時更新本使用條款。任何變更將在本頁面發布，並更新「最後更新日期」。繼續使用本服務即表示您接受修訂後的條款。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">10. 適用法律</h2>
                        <p className="leading-relaxed">
                            本使用條款受中華民國法律管轄並據其解釋。因本條款產生的任何爭議，雙方同意以台灣台北地方法院為第一審管轄法院。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">11. 聯絡方式</h2>
                        <p className="leading-relaxed">
                            如果您對本使用條款有任何疑問，請與我們聯繫。我們將盡力在合理時間內回覆您的詢問。
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
                        onClick={() => router.push('/privacy')}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        隱私權政策
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
