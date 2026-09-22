/**
 * タスクボードのドメインロジック。
 *
 * ここには「画面」も「通信」も書かない。純粋な関数だけを置くことで、
 * ブラウザを起動せずにユニットテストで仕様を固定できるようにしている。
 */

/** 1件のタスクを表す型 */
export type Task = {
  /** 一意な ID。DB を使う場合は DB 側の主キーをそのまま入れる */
  id: string
  /** タスクのタイトル（空文字は不可） */
  title: string
  /** 完了しているかどうか */
  done: boolean
  /** 作成日時（ISO 8601 文字列）。並び順の決定に使う */
  createdAt: string
}

/** 一覧の絞り込み条件 */
export type Filter = 'all' | 'active' | 'done'

/**
 * タスクを新規作成する。
 *
 * @param title 入力されたタイトル（前後の空白は取り除く）
 * @param now 作成日時。テストで固定できるように引数で受け取る
 * @param id ID 生成関数。テストで固定できるように引数で受け取る
 * @returns 作成された Task
 * @throws タイトルが空（空白のみを含む）の場合
 */
export function createTask(
  title: string,
  now: Date = new Date(),
  id: () => string = () => crypto.randomUUID(),
): Task {
  const trimmed = title.trim()

  // 空タイトルの登録は「バグの温床」なので、ここで早めに落とす
  if (trimmed === '') {
    throw new Error('タイトルを入力してください')
  }

  return {
    id: id(),
    title: trimmed,
    done: false,
    createdAt: now.toISOString(),
  }
}

/**
 * 指定した ID のタスクの完了状態を反転させる。
 *
 * 元の配列は書き換えず、新しい配列を返す（React の状態更新で扱いやすくするため）。
 *
 * @param tasks 現在のタスク一覧
 * @param id 反転させたいタスクの ID
 * @returns 更新後のタスク一覧
 */
export function toggleTask(tasks: Task[], id: string): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
}

/**
 * 指定した ID のタスクを削除する。
 *
 * @param tasks 現在のタスク一覧
 * @param id 削除したいタスクの ID
 * @returns 削除後のタスク一覧
 */
export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id)
}

/**
 * 絞り込み条件に従ってタスクを抽出する。
 *
 * @param tasks 現在のタスク一覧
 * @param filter 絞り込み条件
 * @returns 条件に一致したタスクの配列
 */
export function filterTasks(tasks: Task[], filter: Filter): Task[] {
  switch (filter) {
    case 'active':
      // 未完了のみ
      return tasks.filter((task) => !task.done)
    case 'done':
      // 完了済みのみ
      return tasks.filter((task) => task.done)
    default:
      return tasks
  }
}

/**
 * 未完了タスクの件数を数える。画面のサマリー表示に使う。
 *
 * @param tasks 現在のタスク一覧
 * @returns 未完了タスクの件数
 */
export function countActive(tasks: Task[]): number {
  return tasks.filter((task) => !task.done).length
}
