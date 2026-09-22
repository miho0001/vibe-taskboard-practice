import { useEffect, useState } from 'react'
import { loadTasks, saveTasks } from './lib/storage'
import {
  countActive,
  createTask,
  filterTasks,
  removeTask,
  renameTask,
  toggleTask,
  type Filter,
  type Task,
} from './lib/tasks'

/**
 * タスクボードの画面本体。
 *
 * ロジックは src/lib/tasks.ts に寄せてあるので、ここは
 * 「入力を受け取る」「結果を表示する」だけに専念している。
 */
export default function App() {
  // 画面が持つ状態は「タスク一覧」「入力中の文字」「絞り込み条件」「エラー文」、
  // それに「いま編集中の行」と「編集中の文字」の 6 つ
  // タスク一覧の初期値は localStorage から復元する。
  // 関数を渡す形にすると初回レンダリング時だけ実行されるので、毎回読み直さずに済む
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState('')
  // 編集中でないときは null。1 度に編集できる行は 1 つだけ、という仕様をこの型で表している
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  // タスク一覧が変わるたびに保存する。
  // 追加・完了・削除それぞれに保存処理を書くと書き漏らすので、1 箇所にまとめている
  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  /**
   * 追加フォームが送信されたときの処理。
   * バリデーションはドメイン側（createTask）に任せ、投げられたエラーを画面に出す。
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    try {
      const created = createTask(draft)
      setTasks((current) => [...current, created])
      // 追加できたら入力欄とエラー表示をリセットする
      setDraft('')
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '追加に失敗しました')
    }
  }

  /**
   * 「編集」ボタンを押したときの処理。その行を入力欄に切り替える。
   *
   * @param taskToEdit 編集を始めるタスク
   */
  const startEditing = (taskToEdit: Task) => {
    setEditingId(taskToEdit.id)
    // 入力欄には現在のタイトルを初期値として入れておく
    setEditDraft(taskToEdit.title)
    // 前の操作で出ていたエラーが残り続けないように消す
    setError('')
  }

  /** 編集をやめて表示を元に戻す。タスクの内容には一切触らない */
  const cancelEditing = () => {
    setEditingId(null)
    setEditDraft('')
    setError('')
  }

  /**
   * 編集フォームが送信されたときの処理。
   * バリデーションはドメイン側（renameTask）に任せ、失敗したら編集中のまま留まる。
   *
   * @param id 編集中のタスクの ID
   */
  const handleRename = (event: React.FormEvent, id: string) => {
    event.preventDefault()

    try {
      // renameTask は setTasks の外で呼ぶ。更新関数の中で throw すると
      // React がそれを後から実行するため、この try では捕まえられない
      const renamed = renameTask(tasks, id, editDraft)
      setTasks(renamed)
      // 保存できたときだけ編集モードを抜ける
      cancelEditing()
    } catch (e) {
      // 失敗時は editingId を戻さないので、入力欄は開いたままで元のタイトルも保たれる
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    }
  }

  // 表示するのは絞り込み後の配列。元データ（tasks）は加工しない
  const visibleTasks = filterTasks(tasks, filter)

  return (
    <main className="app">
      <h1>タスクボード</h1>

      {/* 追加フォーム */}
      <form onSubmit={handleSubmit} className="form">
        <input
          aria-label="タスク名"
          placeholder="やることを入力"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit">追加</button>
      </form>

      {/* エラーがあるときだけ表示する。role="alert" は支援技術にも伝わる */}
      {error !== '' && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {/* 絞り込みボタン。aria-pressed で「今どれが選ばれているか」を表現する */}
      <div className="filters">
        {(['all', 'active', 'done'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {{ all: 'すべて', active: '未完了', done: '完了' }[value]}
          </button>
        ))}
      </div>

      <p className="summary">未完了: {countActive(tasks)} 件</p>

      {/* 一覧。0件のときは空リストではなく案内文を出す */}
      {visibleTasks.length === 0 ? (
        <p className="empty">タスクがありません</p>
      ) : (
        <ul className="list">
          {visibleTasks.map((item) =>
            // 編集中の行だけ、チェックボックスの代わりに入力欄を出す
            item.id === editingId ? (
              <li key={item.id} className="editing">
                <form onSubmit={(event) => handleRename(event, item.id)} className="edit-form">
                  <input
                    aria-label="タスク名を編集"
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    autoFocus
                  />
                  <button type="submit">保存</button>
                  <button type="button" onClick={cancelEditing}>
                    キャンセル
                  </button>
                </form>
              </li>
            ) : (
              <li key={item.id} className={item.done ? 'done' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => setTasks((current) => toggleTask(current, item.id))}
                  />
                  <span>{item.title}</span>
                </label>
                <span className="actions">
                  <button
                    type="button"
                    aria-label={`${item.title} を編集`}
                    onClick={() => startEditing(item)}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    aria-label={`${item.title} を削除`}
                    onClick={() => setTasks((current) => removeTask(current, item.id))}
                  >
                    削除
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}
    </main>
  )
}
