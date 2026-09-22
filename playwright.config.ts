import os from 'node:os'
import { defineConfig, devices } from '@playwright/test'
import { resolveChannel } from './playwright.browser'

/**
 * E2E テスト（Playwright）の設定。
 *
 * webServer を指定しておくと、テスト実行時に自動でアプリを起動してくれるので
 * 「先にサーバーを立てるのを忘れて落ちる」という事故が起きない。
 */

// 使うブラウザは OS ごとに変わる（判定の理由は playwright.browser.ts を参照）。
// undefined なら Playwright 同梱の Chromium がそのまま使われる
const channel = resolveChannel(process.platform, os.release(), process.env.PLAYWRIGHT_CHANNEL)

export default defineConfig({
  testDir: './e2e',
  // CI では並列実行によるゆらぎを避けるため 1 ワーカーに固定する
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    // 失敗したときだけスクリーンショットとトレースを残す（原因調査が一瞬で終わる）
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
