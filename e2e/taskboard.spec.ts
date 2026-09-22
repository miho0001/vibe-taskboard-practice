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
