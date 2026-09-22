/**
 * タスク一覧をブラウザの localStorage に保存・復元するための処理。
 *
 * 「保存先が壊れていてもアプリが落ちない」ことを最優先にしている。
 * 画面（App.tsx）からは loadTasks / saveTasks だけを呼べばよい。
 */

import type { Task } from './tasks'

/**
 * localStorage に保存するときのキー。
 * 将来ほかのデータも保存する可能性があるので、アプリ名で名前空間を切っている。
 */
export const STORAGE_KEY = 'vibe-taskboard:tasks'

/**
 * 受け取った値が Task として扱えるかどうかを判定する。
 *
 * localStorage の中身はユーザーが手で書き換えられるし、
 * 古いバージョンのアプリが書いた形式が残っていることもある。
 * 「信用せずに毎回検査する」のが安全。
 *
 * @param value 検査したい値（JSON.parse の結果など、型が分からないもの）
 * @returns Task の形をしていれば true
 */
function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.done === 'boolean' &&
    typeof candidate.createdAt === 'string'
  )
}

/**
 * 保存されていた文字列を Task の配列に変換する。
 *
 * 壊れたデータ（JSON として読めない・配列ではない・項目の形が違う）は
 * 例外を投げずに空配列として扱う。画面が真っ白になるのを防ぐため。
 *
 * @param raw localStorage から読み出した文字列（未保存なら null）
 * @returns 復元できた Task の配列。復元できなければ空配列
 */
export function parseTasks(raw: string | null): Task[] {
  // 一度も保存していない場合は null が返ってくる
  if (raw === null) {
    return []
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // JSON として壊れている場合は、保存が無かったものとして扱う
    return []
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  // 配列の一部だけ壊れているケースもあるので、要素単位で捨てる
  return parsed.filter(isTask)
}

/**
 * 保存済みのタスク一覧を読み出す。
 *
 * @param storage 保存先。テストから差し替えられるように引数で受け取る
 * @returns 復元できた Task の配列。読み出せない場合は空配列
 */
export function loadTasks(storage: Storage = localStorage): Task[] {
  try {
    return parseTasks(storage.getItem(STORAGE_KEY))
  } catch {
    // プライベートブラウジングなどで localStorage 自体が使えないことがある
    return []
  }
}

/**
 * タスク一覧を保存する。
 *
 * 保存に失敗しても操作自体は続けられるようにしたいので、例外は握りつぶす。
 *
 * @param tasks 保存したいタスク一覧
 * @param storage 保存先。テストから差し替えられるように引数で受け取る
 */
export function saveTasks(tasks: Task[], storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // 容量オーバーや localStorage 無効時。保存できなくても画面は動かし続ける
  }
}
