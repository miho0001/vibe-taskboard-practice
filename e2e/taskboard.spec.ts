import { expect, test } from '@playwright/test'

/**
 * E2E テスト（本物のブラウザで、ユーザーと同じ操作を再現するテスト）。
 *
 * 「Given（前提）/ When（操作）/ Then（期待）」の形で書くと、
 * 非エンジニアのレビュアーでも読める仕様書になる。
 */
test.describe('タスクボード', () => {
  test.beforeEach(async ({ page }) => {
    // Given: トップページを開いている
    await page.goto('/')
  })

  test('タスクを追加すると一覧に表示され、未完了件数が増える', async ({ page }) => {
    // When: タスク名を入力して追加ボタンを押す
    await page.getByLabel('タスク名').fill('現地調査の日程を決める')
    await page.getByRole('button', { name: '追加' }).click()

    // Then: 一覧に表示され、未完了が 1 件になる
    await expect(page.getByText('現地調査の日程を決める')).toBeVisible()
    await expect(page.getByText('未完了: 1 件')).toBeVisible()
  })

  test('チェックを入れると完了扱いになり、未完了で絞り込むと消える', async ({ page }) => {
    // Given: タスクが 1 件ある
    await page.getByLabel('タスク名').fill('議事録を送る')
    await page.getByRole('button', { name: '追加' }).click()

    // When: チェックを入れて「未完了」で絞り込む
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: '未完了' }).click()

    // Then: 一覧から消え、空の案内が出る
    await expect(page.getByText('議事録を送る')).toBeHidden()
    await expect(page.getByText('タスクがありません')).toBeVisible()
  })

  test('空のまま追加するとエラーが出て、タスクは増えない', async ({ page }) => {
    // When: 何も入力せずに追加ボタンを押す
    await page.getByRole('button', { name: '追加' }).click()

    // Then: エラーメッセージが出て、件数は 0 のまま
    await expect(page.getByRole('alert')).toHaveText('タイトルを入力してください')
    await expect(page.getByText('未完了: 0 件')).toBeVisible()
  })

  test('追加したタスクはリロードしても残り、完了状態も保たれる', async ({ page }) => {
    // Given: タスクを 2 件追加し、片方を完了にしている
    await page.getByLabel('タスク名').fill('資料をまとめる')
    await page.getByRole('button', { name: '追加' }).click()
    await page.getByLabel('タスク名').fill('請求書を送る')
    await page.getByRole('button', { name: '追加' }).click()
    await page.getByRole('checkbox').first().check()

    // When: ブラウザをリロードする
    await page.reload()

    // Then: 2 件とも残り、完了状態と未完了件数も元のまま
    await expect(page.getByText('資料をまとめる')).toBeVisible()
    await expect(page.getByText('請求書を送る')).toBeVisible()
    await expect(page.getByRole('checkbox').first()).toBeChecked()
    await expect(page.getByText('未完了: 1 件')).toBeVisible()
  })

  test('削除したタスクはリロード後も消えたままになる', async ({ page }) => {
    // Given: タスクが 1 件ある
    await page.getByLabel('タスク名').fill('不要になったタスク')
    await page.getByRole('button', { name: '追加' }).click()

    // When: 削除してからリロードする
    await page.getByRole('button', { name: '不要になったタスク を削除' }).click()
    await page.reload()

    // Then: 復活せず、空の案内が出たまま
    await expect(page.getByText('不要になったタスク')).toBeHidden()
    await expect(page.getByText('タスクがありません')).toBeVisible()
  })

  test('タスクのタイトルを編集すると、リロード後も新しいタイトルのまま残る', async ({ page }) => {
    // Given: タスクが 1 件ある
    await page.getByLabel('タスク名').fill('現地調査の日程を決める')
    await page.getByRole('button', { name: '追加' }).click()

    // When: 「編集」を押してタイトルを書き換え、保存してからリロードする
    await page.getByRole('button', { name: '現地調査の日程を決める を編集' }).click()
    await page.getByLabel('タスク名を編集').fill('現地調査の日程を確定する')
    await page.getByRole('button', { name: '保存' }).click()
    await page.reload()

    // Then: 新しいタイトルだけが残っている
    await expect(page.getByText('現地調査の日程を確定する')).toBeVisible()
    await expect(page.getByText('現地調査の日程を決める')).toBeHidden()
  })

  test('空のまま保存しようとするとエラーが出て、元のタイトルが保たれる', async ({ page }) => {
    // Given: タスクを 1 件追加して編集を始めている
    await page.getByLabel('タスク名').fill('議事録を送る')
    await page.getByRole('button', { name: '追加' }).click()
    await page.getByRole('button', { name: '議事録を送る を編集' }).click()

    // When: 入力欄を空にして保存を押す
    await page.getByLabel('タスク名を編集').fill('')
    await page.getByRole('button', { name: '保存' }).click()

    // Then: エラーが出て入力欄は開いたまま。キャンセルすると元のタイトルに戻る
    await expect(page.getByRole('alert')).toHaveText('タイトルを入力してください')
    await expect(page.getByLabel('タスク名を編集')).toBeVisible()
    await page.getByRole('button', { name: 'キャンセル' }).click()
    await expect(page.getByText('議事録を送る')).toBeVisible()
  })

  test('編集をキャンセルすると入力内容は捨てられる', async ({ page }) => {
    // Given: タスクを 1 件追加して編集を始めている
    await page.getByLabel('タスク名').fill('請求書を送る')
    await page.getByRole('button', { name: '追加' }).click()
    await page.getByRole('button', { name: '請求書を送る を編集' }).click()

    // When: 書き換えたうえでキャンセルする
    await page.getByLabel('タスク名を編集').fill('破棄される入力')
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // Then: 元のタイトルのままで、入力内容はどこにも残らない
    await expect(page.getByText('請求書を送る')).toBeVisible()
    await expect(page.getByText('破棄される入力')).toBeHidden()
  })

  test('保存データが壊れていても空の一覧で起動する', async ({ page }) => {
    // Given: localStorage に JSON として読めない値が入っている
    await page.evaluate(() => localStorage.setItem('vibe-taskboard:tasks', '壊れたデータ'))

    // When: 開き直す
    await page.reload()

    // Then: 画面が真っ白にならず、空の一覧として使い始められる
    await expect(page.getByText('タスクがありません')).toBeVisible()
    await expect(page.getByLabel('タスク名')).toBeVisible()
  })
})

/**
 * スマホ幅での表示崩れを防ぐためのテスト。
 *
 * 横スクロールは「どこか 1 要素が画面幅を超えている」ときに起きるので、
 * ページ全体の scrollWidth が画面幅を超えていないことを見張れば足りる。
 */
test.describe('スマホ幅での表示', () => {
  // iPhone の代表的な論理解像度。Issue の完了条件に合わせて 375px で確認する
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    // Given: スマホ幅でトップページを開いている
    await page.goto('/')
  })

  /**
   * テスト用のタスクを localStorage に流し込んでから開き直す。
   *
   * 画面から 1 件ずつ追加すると時間がかかるうえ、
   * 「折り返しにくい長いタイトル」を入力する手間が本題からずれるため。
   *
   * @param page Playwright のページ
   * @param titles 用意したいタスクのタイトル
   */
  async function seedTasks(page: import('@playwright/test').Page, titles: string[]) {
    await page.evaluate((list) => {
      localStorage.setItem(
        'vibe-taskboard:tasks',
        JSON.stringify(
          list.map((title, index) => ({
            id: `seed-${index}`,
            title,
            done: false,
            createdAt: '2026-01-01T00:00:00.000Z',
          })),
        ),
      )
    }, titles)
    await page.reload()
  }

  /**
   * ページ全体が画面幅に収まっているかを調べる。
   *
   * @param page Playwright のページ
   * @returns 中身の幅（scrollWidth）と画面の幅（clientWidth）
   */
  async function measureWidth(page: import('@playwright/test').Page) {
    return page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
  }

  test('タスクが無いときは横スクロールが出ない', async ({ page }) => {
    // When: 幅 375px で開く
    const { scrollWidth, clientWidth } = await measureWidth(page)

    // Then: 中身が画面幅に収まっている
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })

  test('折り返しにくい長いタイトルがあっても横スクロールが出ない', async ({ page }) => {
    // Given: 空白が無く途中で折り返せないタイトルのタスクがある（横はみ出しの典型例）
    await seedTasks(page, [
      'https://example.com/very/long/path/that/never/breaks/anywhere/at/all',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '現地調査の日程を関係者全員と調整してから先方に連絡する',
    ])

    // When: 幅を測る
    const { scrollWidth, clientWidth } = await measureWidth(page)

    // Then: 中身が画面幅に収まっている
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })

  test('長いタイトルでも編集・削除ボタンが画面内に収まっている', async ({ page }) => {
    // Given: 長いタイトルのタスクが 1 件ある
    const title = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    await seedTasks(page, [title])

    // Then: ボタンが画面外に押し出されていない
    await expect(page.getByRole('button', { name: `${title} を編集` })).toBeInViewport()
    await expect(page.getByRole('button', { name: `${title} を削除` })).toBeInViewport()
  })

  test('編集中でも入力欄とボタンが画面内に収まっている', async ({ page }) => {
    // Given: 長いタイトルのタスクを編集し始めている
    const title = 'https://example.com/very/long/path/that/never/breaks/anywhere/at/all'
    await seedTasks(page, [title])
    await page.getByRole('button', { name: `${title} を編集` }).click()

    // Then: 横スクロールは出ず、入力欄も両方のボタンも画面内にある
    const { scrollWidth, clientWidth } = await measureWidth(page)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    await expect(page.getByLabel('タスク名を編集')).toBeInViewport()
    await expect(page.getByRole('button', { name: '保存' })).toBeInViewport()
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeInViewport()
  })

  test('追加フォームと絞り込みボタンが画面内に収まっている', async ({ page }) => {
    // Then: 画面上部の操作系もはみ出していない
    await expect(page.getByLabel('タスク名')).toBeInViewport()
    await expect(page.getByRole('button', { name: '追加' })).toBeInViewport()
    for (const name of ['すべて', '未完了', '完了']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeInViewport()
    }
  })
})
