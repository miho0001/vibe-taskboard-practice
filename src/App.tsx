import { useState } from 'react'
import {
  countActive,
  createTask,
  filterTasks,
  removeTask,
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
  // 画面が持つ状態は「タスク一覧」「入力中の文字」「絞り込み条件」「エラー文」の 4 つだけ
  const [tasks, setTasks] = useState<Task[]>([])
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState('')

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
          {visibleTasks.map((item) => (
            <li key={item.id} className={item.done ? 'done' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => setTasks((current) => toggleTask(current, item.id))}
                />
                <span>{item.title}</span>
              </label>
              <button
                type="button"
                aria-label={`${item.title} を削除`}
                onClick={() => setTasks((current) => removeTask(current, item.id))}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
