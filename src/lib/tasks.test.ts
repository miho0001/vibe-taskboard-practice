import { describe, expect, it } from 'vitest'
import {
  countActive,
  createTask,
  filterTasks,
  removeTask,
  toggleTask,
  type Task,
} from './tasks'

/**
 * テスト用のタスクを組み立てるヘルパー。
 * 毎回 4 つのプロパティを書かなくて済むようにしている。
 */
function task(id: string, title: string, done = false): Task {
  return { id, title, done, createdAt: '2026-01-01T00:00:00.000Z' }
}

describe('createTask', () => {
  it('タイトル・未完了・作成日時を持つタスクを作る', () => {
    // 日時と ID を固定して、結果が毎回同じになるようにする
    const created = createTask('牛乳を買う', new Date('2026-01-01T00:00:00.000Z'), () => 'id-1')

    expect(created).toEqual({
      id: 'id-1',
      title: '牛乳を買う',
      done: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('前後の空白は取り除かれる', () => {
    const created = createTask('  掃除する  ', new Date(), () => 'id-2')
    expect(created.title).toBe('掃除する')
  })

  it('空文字や空白だけのタイトルはエラーになる', () => {
    // 「異常系もテストする」のが案件で信頼される最短ルート
    expect(() => createTask('')).toThrow('タイトルを入力してください')
    expect(() => createTask('   ')).toThrow('タイトルを入力してください')
  })
})

describe('toggleTask', () => {
  it('指定した ID のタスクだけ完了状態が反転する', () => {
    const tasks = [task('a', 'A'), task('b', 'B')]
    const result = toggleTask(tasks, 'a')

    expect(result[0].done).toBe(true)
    expect(result[1].done).toBe(false)
  })

  it('元の配列を書き換えない', () => {
    const tasks = [task('a', 'A')]
    toggleTask(tasks, 'a')
    expect(tasks[0].done).toBe(false)
  })
})

describe('removeTask', () => {
  it('指定した ID のタスクが消える', () => {
    const tasks = [task('a', 'A'), task('b', 'B')]
    expect(removeTask(tasks, 'a')).toEqual([task('b', 'B')])
  })
})

describe('filterTasks', () => {
  const tasks = [task('a', 'A', false), task('b', 'B', true)]

  it('all はすべて返す', () => {
    expect(filterTasks(tasks, 'all')).toHaveLength(2)
  })

  it('active は未完了だけ返す', () => {
    expect(filterTasks(tasks, 'active')).toEqual([task('a', 'A', false)])
  })

  it('done は完了済みだけ返す', () => {
    expect(filterTasks(tasks, 'done')).toEqual([task('b', 'B', true)])
  })
})

describe('countActive', () => {
  it('未完了の件数を数える', () => {
    expect(countActive([task('a', 'A'), task('b', 'B', true), task('c', 'C')])).toBe(2)
  })
})
