import { defineConfig, devices } from '@playwright/test'

/**
 * E2E テスト（Playwright）の設定。
 *
 * webServer を指定しておくと、テスト実行時に自動でアプリを起動してくれるので
 * 「先にサーバーを立てるのを忘れて落ちる」という事故が起きない。
 */
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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
