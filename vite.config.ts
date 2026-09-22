import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Vite の設定。開発サーバー・本番ビルド・Vitest（ユニットテスト）の設定をまとめている。
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom を使うことで、ブラウザを起動せずに React コンポーネントのテストができる
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // E2E テスト（Playwright 管轄）は Vitest の対象から除外する
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
