import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// index.html の #root に React アプリを描画する（アプリの入口）
const container = document.getElementById('root')

// 万が一 #root が無いときは、原因が分かるエラーで止める
if (!container) {
  throw new Error('#root が見つかりません')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
