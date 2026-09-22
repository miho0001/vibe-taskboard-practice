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
})
