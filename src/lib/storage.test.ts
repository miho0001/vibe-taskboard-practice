import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY, loadTasks, parseTasks, saveTasks } from './storage'
import type { Task } from './tasks'

/**
 * localStorage 保存処理のテスト。
 * 「正常に往復できること」よりも「壊れたデータで落ちないこと」を厚めに確認する。
 */

/** テスト用のタスクを組み立てるヘルパー */
function task(id: string, title: string, done = false): Task {
  return { id, title, done, createdAt: '2026-01-01T00:00:00.000Z' }
}

describe('parseTasks', () => {
  it('保存された JSON をタスク配列に戻す', () => {
    const tasks = [task('a', 'A'), task('b', 'B', true)]
    expect(parseTasks(JSON.stringify(tasks))).toEqual(tasks)
  })

  it('一度も保存していない（null）なら空配列を返す', () => {
    expect(parseTasks(null)).toEqual([])
  })

  it('JSON として壊れていても例外を投げず空配列を返す', () => {
    // 手で書き換えられた・書き込み途中で切れた、といったケース
    expect(parseTasks('{壊れたデータ')).toEqual([])
  })

  it('配列以外が保存されていたら空配列を返す', () => {
    expect(parseTasks('{"tasks":[]}')).toEqual([])
    expect(parseTasks('"文字列"')).toEqual([])
  })

  it('形が違う要素は捨てて、正しい要素だけ残す', () => {
    const raw = JSON.stringify([
      task('a', 'A'),
      { id: 'b' }, // title / done / createdAt が無い
      null,
      { id: 1, title: 'C', done: false, createdAt: '2026-01-01T00:00:00.000Z' }, // id が数値
    ])

    expect(parseTasks(raw)).toEqual([task('a', 'A')])
  })
})

describe('saveTasks / loadTasks', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('保存したタスクをそのまま読み戻せる', () => {
    const tasks = [task('a', '牛乳を買う'), task('b', '掃除する', true)]

    saveTasks(tasks)

    expect(loadTasks()).toEqual(tasks)
  })

  it('保存し直すと前回の内容を上書きする（削除が残らない）', () => {
    saveTasks([task('a', 'A'), task('b', 'B')])
    saveTasks([task('b', 'B')])

    expect(loadTasks()).toEqual([task('b', 'B')])
  })

  it('何も保存していなければ空配列を返す', () => {
    expect(loadTasks()).toEqual([])
  })

  it('保存先が壊れていても空配列で起動できる', () => {
    localStorage.setItem(STORAGE_KEY, 'これは JSON ではない')

    expect(loadTasks()).toEqual([])
  })

  it('localStorage が使えない環境でも例外を投げない', () => {
    // プライベートブラウジング等で getItem / setItem が例外を投げる状況を再現する
    const broken = {
      getItem: () => {
        throw new Error('localStorage は利用できません')
      },
      setItem: () => {
        throw new Error('localStorage は利用できません')
      },
    } as unknown as Storage

    expect(() => saveTasks([task('a', 'A')], broken)).not.toThrow()
    expect(loadTasks(broken)).toEqual([])
  })
})
