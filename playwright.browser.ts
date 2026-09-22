/**
 * E2E をどのブラウザで実行するかを決めるロジック。
 *
 * playwright.config.ts から切り出してある。設定ファイルの中に書くと
 * ユニットテストから読み込みにくい（@playwright/test ごと引き込んでしまう）ため。
 */

/**
 * Playwright 同梱の Chromium が使えない macOS かどうかを判定する。
 *
 * 同梱 Chromium は macOS 14 以降にしか対応しておらず、macOS 13 では
 * `npx playwright install chromium` 自体が
 * 「ERROR: Playwright does not support chromium on mac13」で失敗する。
 * Darwin のメジャーバージョンは macOS より 9 大きい（macOS 13 = Darwin 22）ので、
 * 22 以下なら「同梱 Chromium が入らない macOS」と判断できる。
 *
 * @param platform 実行中の OS（process.platform 相当）
 * @param release カーネルのバージョン文字列（os.release() 相当。例: '22.6.0'）
 * @returns 同梱 Chromium が使えないなら true
 */
export function isBundledChromiumUnsupported(platform: string, release: string): boolean {
  if (platform !== 'darwin') return false

  const darwinMajor = Number(release.split('.')[0])
  // 数値として読めなかった場合は、余計な切り替えをせず同梱 Chromium に任せる
  return Number.isFinite(darwinMajor) && darwinMajor <= 22
}

/**
 * 使う Playwright の channel を決める。
 *
 * - 既定（macOS 14 以降・Linux・Windows・CI）: undefined = 同梱の Chromium
 * - macOS 13: 'chrome' = インストール済みの Google Chrome
 * - 環境変数の指定があれば、OS の判定より優先する
 *
 * @param platform 実行中の OS（process.platform 相当）
 * @param release カーネルのバージョン文字列（os.release() 相当）
 * @param envChannel 環境変数 PLAYWRIGHT_CHANNEL の値（未設定なら undefined）
 * @returns 使う channel。undefined なら同梱 Chromium
 */
export function resolveChannel(
  platform: string,
  release: string,
  envChannel: string | undefined,
): string | undefined {
  // 明示的な指定が最優先。'chromium' を渡せば自動切り替えを打ち消せる
  if (envChannel !== undefined && envChannel !== '') return envChannel

  return isBundledChromiumUnsupported(platform, release) ? 'chrome' : undefined
}
