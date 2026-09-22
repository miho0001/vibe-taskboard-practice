import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEY, loadTasks } from './lib/storage'

/**
 * 画面（コンポーネント）のテスト。
 * 「ユーザーが何をしたら、何が見えるか」だけを検証し、内部実装には触れない。
 */
describe('App', () => {
  beforeEach(() => {
    // 保存内容がテスト間で持ち越されないように、毎回まっさらにする
    localStorage.clear()
  })

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

  it('保存済みのタスクを起動時に復元する', () => {
    // Given: 前回の利用時に保存されたデータがある
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'a', title: '前回追加したタスク', done: false, createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'b', title: '完了済みタスク', done: true, createdAt: '2026-01-01T00:00:00.000Z' },
      ]),
    )

    render(<App />)

    // Then: 一覧にも完了状態にも反映されている
    expect(screen.getByText('前回追加したタスク')).toBeInTheDocument()
    expect(screen.getByText('未完了: 1 件')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')[1]).toBeChecked()
  })

  it('保存データが壊れていても空の一覧で起動する', () => {
    localStorage.setItem(STORAGE_KEY, '壊れたデータ')

    render(<App />)

    expect(screen.getByText('タスクがありません')).toBeInTheDocument()
    expect(screen.getByText('未完了: 0 件')).toBeInTheDocument()
  })

  it('追加・完了・削除の結果が保存される', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('タスク名'), '残すタスク')
    await user.click(screen.getByRole('button', { name: '追加' }))
    await user.type(screen.getByLabelText('タスク名'), '消すタスク')
    await user.click(screen.getByRole('button', { name: '追加' }))

    // 1件目を完了にし、2件目を削除する
    await user.click(screen.getAllByRole('checkbox')[0])
    await user.click(screen.getByRole('button', { name: '消すタスク を削除' }))

    const saved = loadTasks()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ title: '残すタスク', done: true })
  })
})
