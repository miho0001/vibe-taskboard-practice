import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

/**
 * 画面（コンポーネント）のテスト。
 * 「ユーザーが何をしたら、何が見えるか」だけを検証し、内部実装には触れない。
 */
describe('App', () => {
  it('タスクを追加すると一覧に表示される', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('タスク名'), '請求書を送る')
    await user.click(screen.getByRole('button', { name: '追加' }))

    expect(screen.getByText('請求書を送る')).toBeInTheDocument()
    expect(screen.getByText('未完了: 1 件')).toBeInTheDocument()
  })

  it('空のまま追加するとエラーが表示される', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '追加' }))

    expect(screen.getByRole('alert')).toHaveTextContent('タイトルを入力してください')
  })

  it('チェックを入れると未完了件数が減る', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('タスク名'), '掃除する')
    await user.click(screen.getByRole('button', { name: '追加' }))
    await user.click(screen.getByRole('checkbox'))

    expect(screen.getByText('未完了: 0 件')).toBeInTheDocument()
  })

  it('「完了」で絞り込むと未完了タスクは表示されない', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('タスク名'), '見積を作る')
    await user.click(screen.getByRole('button', { name: '追加' }))
    await user.click(screen.getByRole('button', { name: '完了' }))

    expect(screen.queryByText('見積を作る')).not.toBeInTheDocument()
    expect(screen.getByText('タスクがありません')).toBeInTheDocument()
  })
})
