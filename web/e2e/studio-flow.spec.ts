import { expect, test, type Locator } from '@playwright/test'

async function selectFirstRealOption(labelledSelect: Locator) {
  const optionCount = await labelledSelect.locator('option').count()
  if (optionCount < 2) {
    throw new Error('Expected at least one selectable option, but only found the placeholder.')
  }

  await labelledSelect.selectOption({ index: 1 })
}

test.describe('studio browser flow', () => {
  test('operator can complete the studio workflow through the browser', async ({ page }) => {
    test.setTimeout(180000)

    const runId = process.env.STUDIO_E2E_RUN_ID || `e2e-${Date.now()}`
    const adminEmail = process.env.STUDIO_E2E_ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.STUDIO_E2E_ADMIN_PASSWORD || 'changeme123'
    const characterCode = `${runId}-char`
    const characterName = `E2E Character ${runId}`
    const templateCode = `${runId}-template`
    const scene = `Window Scene ${runId}`
    const intent = `Quiet Confidence ${runId}`
    const firstCaption = `E2E caption option ${runId}`
    const secondCaption = `Second caption option ${runId}`
    const finalCaption = `E2E final caption ${runId}`
    const postUrl = `https://x.com/studio_smoke/status/${Date.now()}`

    await page.goto('/review')
    await page.getByLabel('Email address').fill(adminEmail)
    await page.getByLabel('Password').fill(adminPassword)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await page.goto('/settings')
    await expect(page.getByText('Studio Smoke X')).toBeVisible()

    await page.goto('/characters')
    await page.getByLabel('Code').fill(characterCode)
    await page.getByLabel('Display name').fill(characterName)
    await page.getByLabel('Nationality').fill('Japan')
    await page.getByLabel('Profession').fill('Model')
    await page.getByLabel('Persona summary').fill(`Browser-created persona ${runId}`)
    await page.getByLabel('Style notes').fill('soft glam, candid framing')
    await page.getByLabel('Face reference asset IDs').fill(`face-${runId}`)
    await page.getByRole('button', { name: 'Save character' }).click()
    await expect(page.getByText(characterName)).toBeVisible()

    await page.goto('/templates')
    await page.getByLabel('Code').fill(templateCode)
    await page.getByLabel('Scene').fill(scene)
    await page.getByLabel('Intent').fill(intent)
    await page.getByLabel('Outfit tags').fill('silk robe')
    await page.getByLabel('Fetish tags').fill('wet hair')
    await page.getByLabel('Positive blocks').fill('cinematic portrait\nhigh detail skin')
    await page.getByLabel('Negative blocks').fill('extra fingers\nblurry eyes')
    await page.getByRole('button', { name: 'Save template' }).click()
    await expect(page.getByText(scene)).toBeVisible()

    await page.goto('/generate')
    await expect(page.getByText('Active X account ready')).toBeVisible()
    await selectFirstRealOption(page.getByLabel('Character'))
    await selectFirstRealOption(page.getByLabel('Template'))
    await page.getByRole('button', { name: 'Create generation run' }).click()
    await expect(page.locator('img[alt^="Generated asset"]').first()).toBeVisible({ timeout: 30000 })

    await page.goto('/review')
    const reviewCard = page.locator('article').filter({ hasText: characterName }).first()
    await expect(reviewCard).toBeVisible({ timeout: 30000 })
    await reviewCard.getByLabel('Review score').fill('95')
    await reviewCard.getByLabel('Operator note').fill(`Approved in browser E2E ${runId}`)
    await reviewCard.getByRole('button', { name: 'Approve' }).click()
    await expect(reviewCard.getByText('Approved')).toBeVisible()

    await page.goto('/publish')
    await selectFirstRealOption(page.getByLabel('Approved asset'))
    await page.getByLabel('Caption options').fill(`${firstCaption}\n${secondCaption}`)
    await page.getByLabel('Hashtags').fill('#AIBeauty,#StudioE2E')
    await page.getByLabel('CTA').fill('Browser CTA')
    await page.getByLabel('Publish note').fill(`Browser note ${runId}`)
    await page.getByRole('button', { name: 'Create draft' }).click()
    await expect(page.getByText(firstCaption)).toBeVisible()

    await selectFirstRealOption(page.getByLabel('Content draft'))
    await page.getByLabel('Final caption').fill(finalCaption)
    await page.getByLabel('Checklist').fill('confirm crop\npaste tracking URL')
    await page.getByRole('button', { name: 'Create publish package' }).click()
    await expect(page.getByText(finalCaption)).toBeVisible()

    await page.goto('/insights')
    await selectFirstRealOption(page.getByLabel('Publish package'))
    await page.getByLabel('Post URL').fill(postUrl)
    await page.getByLabel('Impressions').fill('1234')
    await page.getByLabel('Likes').fill('210')
    await page.getByLabel('Reposts').fill('21')
    await page.getByLabel('Replies').fill('5')
    await page.getByLabel('Bookmarks').fill('8')
    await page.getByLabel('Profile visits').fill('13')
    await page.getByLabel('Link clicks').fill('3')
    await page.getByLabel('Operator memo').fill(`Browser published post ${runId}`)
    await page.getByRole('button', { name: 'Record published post' }).click()
    await expect(page.getByRole('link', { name: postUrl })).toBeVisible({ timeout: 20000 })
  })
})
