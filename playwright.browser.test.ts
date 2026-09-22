import { describe, expect, it } from 'vitest'
import { isBundledChromiumUnsupported, resolveChannel } from './playwright.browser'

/**
 * E2E のブラウザ選択ロジックのテスト。
 * 「どの OS だとどのブラウザになるか」を、実際にその OS を用意せずに固定する。
 */
describe('isBundledChromiumUnsupported', () => {
  it('macOS 13（Darwin 22）は同梱 Chromium が使えない', () => {
    expect(isBundledChromiumUnsupported('darwin', '22.6.0')).toBe(true)
  })

  it('macOS 14（Darwin 23）以降は同梱 Chromium が使える', () => {
    // 22 と 23 の境目が仕様の要。ここがずれると macOS 14 でも Chrome を探しに行ってしまう
    expect(isBundledChromiumUnsupported('darwin', '23.0.0')).toBe(false)
    expect(isBundledChromiumUnsupported('darwin', '24.1.0')).toBe(false)
  })

  it('macOS 以外は判定の対象外', () => {
    // CI（ubuntu-latest）がここを通る
    expect(isBundledChromiumUnsupported('linux', '6.8.0-1014-azure')).toBe(false)
    expect(isBundledChromiumUnsupported('win32', '10.0.26100')).toBe(false)
  })

  it('バージョンが数値として読めないときは切り替えない', () => {
    expect(isBundledChromiumUnsupported('darwin', 'unknown')).toBe(false)
  })
})

describe('resolveChannel', () => {
  it('macOS 13 ではインストール済みの Chrome を使う', () => {
    expect(resolveChannel('darwin', '22.6.0', undefined)).toBe('chrome')
  })

  it('macOS 14 以降と CI では同梱 Chromium（undefined）を使う', () => {
    expect(resolveChannel('darwin', '23.0.0', undefined)).toBeUndefined()
    expect(resolveChannel('linux', '6.8.0-1014-azure', undefined)).toBeUndefined()
  })

  it('環境変数の指定は OS の判定より優先される', () => {
    // macOS 13 でも、明示すれば同梱 Chromium を試せる（切り分け用）
    expect(resolveChannel('darwin', '22.6.0', 'chromium')).toBe('chromium')
    expect(resolveChannel('linux', '6.8.0', 'msedge')).toBe('msedge')
  })

  it('環境変数が空文字のときは未設定として扱う', () => {
    // `PLAYWRIGHT_CHANNEL= npm run test:e2e` で意図せず壊れないようにする
    expect(resolveChannel('darwin', '22.6.0', '')).toBe('chrome')
  })
})
