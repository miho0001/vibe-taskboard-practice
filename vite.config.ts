import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Vite の設定。開発サーバー・本番ビルド・Vitest（ユニットテスト）の設定をまとめている。
 */
export default defineConfig({
  // 生成物を相対パスで参照させる。
  // GitHub Pages では /vibe-taskboard-practice/app/ のようにサブディレクトリ配下に置かれるため、
  // 絶対パス（/assets/...）だと読み込めない。'./' なら公開先のパスが変わっても動く
  base: './',
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
