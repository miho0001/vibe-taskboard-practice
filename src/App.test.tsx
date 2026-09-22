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

  describe('タイトルの編集', () => {
    /**
     * タスクを 1 件追加してから「編集」ボタンを押し、入力欄が出た状態にするヘルパー。
     *
     * @param title 追加するタスクのタイトル
     * @returns userEvent のセッション（続けて操作するために返す）
     */
    async function addTaskAndStartEditing(title: string) {
      const user = userEvent.setup()
      render(<App />)

      await user.type(screen.getByLabelText('タスク名'), title)
      await user.click(screen.getByRole('button', { name: '追加' }))
      await user.click(screen.getByRole('button', { name: `${title} を編集` }))

      return user
    }

    it('「編集」を押すと入力欄に切り替わり、現在のタイトルが入っている', async () => {
      await addTaskAndStartEditing('見積を作る')

      expect(screen.getByLabelText('タスク名を編集')).toHaveValue('見積を作る')
      // 入力欄に切り替わっている間は、その行の表示用の要素は出さない
      expect(screen.queryByRole('button', { name: '見積を作る を削除' })).not.toBeInTheDocument()
    })

    it('書き換えて保存すると一覧の表示が変わり、保存もされる', async () => {
      const user = await addTaskAndStartEditing('見積を作る')

      await user.clear(screen.getByLabelText('タスク名を編集'))
      await user.type(screen.getByLabelText('タスク名を編集'), '見積を送る')
      await user.click(screen.getByRole('button', { name: '保存' }))

      expect(screen.getByText('見積を送る')).toBeInTheDocument()
      expect(screen.queryByText('見積を作る')).not.toBeInTheDocument()
      // 保存後は入力欄が閉じて、通常の行に戻る
      expect(screen.queryByLabelText('タスク名を編集')).not.toBeInTheDocument()
      expect(loadTasks()[0]).toMatchObject({ title: '見積を送る' })
    })

    it('空文字で保存しようとするとエラーになり、元のタイトルが保たれる', async () => {
      const user = await addTaskAndStartEditing('消えてはいけない')

      await user.clear(screen.getByLabelText('タスク名を編集'))
      await user.click(screen.getByRole('button', { name: '保存' }))

      expect(screen.getByRole('alert')).toHaveTextContent('タイトルを入力してください')
      // 入力欄は開いたままで、保存済みのタイトルも変わっていない
      expect(screen.getByLabelText('タスク名を編集')).toBeInTheDocument()
      expect(loadTasks()[0]).toMatchObject({ title: '消えてはいけない' })
    })

    it('編集をキャンセルすると元のタイトルのまま表示に戻る', async () => {
      const user = await addTaskAndStartEditing('元のタイトル')

      await user.clear(screen.getByLabelText('タスク名を編集'))
      await user.type(screen.getByLabelText('タスク名を編集'), '破棄される入力')
      await user.click(screen.getByRole('button', { name: 'キャンセル' }))

      expect(screen.getByText('元のタイトル')).toBeInTheDocument()
      expect(screen.queryByText('破棄される入力')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('タスク名を編集')).not.toBeInTheDocument()
      expect(loadTasks()[0]).toMatchObject({ title: '元のタイトル' })
    })

    it('完了状態は編集しても変わらない', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.type(screen.getByLabelText('タスク名'), '完了済みのタスク')
      await user.click(screen.getByRole('button', { name: '追加' }))
      await user.click(screen.getByRole('checkbox'))

      await user.click(screen.getByRole('button', { name: '完了済みのタスク を編集' }))
      await user.clear(screen.getByLabelText('タスク名を編集'))
      await user.type(screen.getByLabelText('タスク名を編集'), '名前だけ変えたタスク')
      await user.click(screen.getByRole('button', { name: '保存' }))

      expect(screen.getByRole('checkbox')).toBeChecked()
      expect(screen.getByText('未完了: 0 件')).toBeInTheDocument()
    })
  })
})
