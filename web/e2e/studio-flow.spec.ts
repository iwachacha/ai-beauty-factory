import { expect, test, type Locator } from '@playwright/test'

async function selectFirstRealOption(labelledSelect: Locator) {
  const optionCount = await labelledSelect.locator('option').count()
  if (optionCount < 2) {
    throw new Error('Expected at least one selectable option, but only found the placeholder.')
  }

  await labelledSelect.selectOption({ index: 1 })
}

test.describe('studio browser flow', () => {
  test('removed legacy routes return 404', async ({ page }) => {
    for (const route of ['/review', '/publish', '/generate', '/characters', '/templates']) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), `expected ${route} to return 404`).toBe(404)
    }
  })

  test('operator can complete the control-room workflow through the browser', async ({ page }) => {
    test.setTimeout(180000)

    const runId = process.env.STUDIO_E2E_RUN_ID || `e2e-${Date.now()}`
    const adminEmail = process.env.STUDIO_E2E_ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.STUDIO_E2E_ADMIN_PASSWORD || 'changeme123'
    const characterCode = `${runId}-char`
    const characterName = `E2E Character ${runId}`
    const templateCode = `${runId}-template`
    const scene = `Window Scene ${runId}`
    const intent = `Quiet Confidence ${runId}`
    const fanvueUrl = `https://fanvue.com/${runId}`
    const firstCaption = `E2E caption option ${runId}`
    const secondCaption = `Second caption option ${runId}`
    const finalCaption = `E2E final caption ${runId}`
    const finalPaidTitle = `Offer title ${runId}`
    const postUrl = `https://x.com/studio_smoke/status/${Date.now()}`

    await page.goto('/setup')
    await page.getByLabel('Email address').fill(adminEmail)
    await page.getByLabel('Password').fill(adminPassword)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await page.getByLabel('Default CTA label').fill(`Full set ${runId}`)
    await page.getByLabel('Default CTA URL').fill(fanvueUrl)
    await page.getByLabel('Public-safe guidelines').fill('safe teaser only\nkeep CTA clean')
    await page.getByLabel('Paid-side guidelines').fill('reserve stronger material for paid only')
    await page.getByRole('button', { name: 'Save defaults' }).click()
    await expect(page.getByLabel('Default CTA URL')).toHaveValue(fanvueUrl)

    await page.getByLabel('Character code').fill(characterCode)
    await page.getByLabel('Character display name').fill(characterName)
    await page.getByLabel('Nationality').fill('Japan')
    await page.getByLabel('Profession').fill('Model')
    await page.getByLabel('Persona summary').fill(`Browser-created persona ${runId}`)
    await page.getByLabel('Style notes').fill('soft glam, candid framing')
    await page.getByLabel('Face reference asset IDs').fill(`face-${runId}`)
    await page.getByRole('button', { name: 'Save character' }).click()
    await expect(page.getByText(characterName)).toBeVisible()

    await page.getByLabel('Template code').fill(templateCode)
    await page.getByLabel('Template scene').fill(scene)
    await page.getByLabel('Intent').fill(intent)
    await page.getByLabel('Outfit tags').fill('silk robe')
    await page.getByLabel('Fetish tags').fill('wet hair')
    await page.getByLabel('Positive blocks').fill('cinematic portrait\nhigh detail skin')
    await page.getByLabel('Negative blocks').fill('extra fingers\nblurry eyes')
    await page.getByRole('button', { name: 'Save template' }).click()
    await expect(page.getByText(scene)).toBeVisible()

    await page.goto('/settings')
    await expect(page.getByText('Studio Smoke X')).toBeVisible()
    await page.getByLabel('Fanvue creator name').fill(`Creator ${runId}`)
    await page.getByLabel('Fanvue base URL').fill(fanvueUrl)
    await page.getByRole('button', { name: 'Save Fanvue destination' }).click()
    await expect(page.getByText(fanvueUrl)).toBeVisible()

    await page.goto('/ops')
    await expect(page.getByText('Active X account ready')).toBeVisible()
    await selectFirstRealOption(page.getByLabel('Generation character'))
    await selectFirstRealOption(page.getByLabel('Generation template'))
    await page.getByRole('button', { name: 'Create generation run' }).click()

    const reviewCard = page.locator('article').filter({ hasText: characterName }).first()
    await expect(reviewCard.locator('img[alt^="Generated asset"]').first()).toBeVisible({ timeout: 30000 })
    await reviewCard.getByLabel('Public safe').check()
    await reviewCard.getByLabel('Review score').fill('95')
    await reviewCard.getByLabel('Operator note').fill(`Approved in browser E2E ${runId}`)
    await reviewCard.getByRole('button', { name: 'Approve' }).click()
    await expect(reviewCard.getByText('Approved')).toBeVisible()
    await expect(reviewCard.getByText('Public safe')).toBeVisible()

    const draftSection = page.locator('section').filter({ hasText: 'Build a dual-surface draft' }).first()
    await selectFirstRealOption(draftSection.getByLabel('Approved asset'))
    await draftSection.getByLabel('Public caption options').fill(`${firstCaption}\n${secondCaption}`)
    await draftSection.getByLabel('Public hashtags').fill('#AIBeauty,#StudioE2E')
    await draftSection.getByLabel('Public CTA label').fill('Browser CTA')
    await draftSection.getByLabel('Public CTA URL').fill(fanvueUrl)
    await draftSection.getByLabel('Paid title').fill(`Paid title ${runId}`)
    await draftSection.getByLabel('Paid teaser').fill(`Paid teaser ${runId}`)
    await draftSection.getByLabel('Paid body').fill(`Paid body ${runId}`)
    await draftSection.getByLabel('Paid offer note').fill(`Paid note ${runId}`)
    await draftSection.getByRole('button', { name: 'Create dual-surface draft' }).click()

    const publicPackageSection = page.locator('section').filter({ hasText: 'Export X public package' }).first()
    await selectFirstRealOption(publicPackageSection.getByLabel('Public package draft'))
    await publicPackageSection.getByLabel('Final public caption').fill(finalCaption)
    await publicPackageSection.getByLabel('Final CTA label').fill('Browser CTA')
    await publicPackageSection.getByLabel('Final CTA URL').fill(fanvueUrl)
    await publicPackageSection.getByLabel('Public checklist').fill('confirm crop\nverify CTA')
    await publicPackageSection.getByRole('button', { name: 'Create X public package' }).click()
    await expect(page.getByText(finalCaption)).toBeVisible()

    const paidPackageSection = page.locator('section').filter({ hasText: 'Export Fanvue paid package' }).first()
    await selectFirstRealOption(paidPackageSection.getByLabel('Paid package draft'))
    await paidPackageSection.getByLabel('Paid title').fill(finalPaidTitle)
    await paidPackageSection.getByLabel('Paid teaser').fill(`Offer teaser ${runId}`)
    await paidPackageSection.getByLabel('Paid body').fill(`Offer body ${runId}`)
    await paidPackageSection.getByLabel('Fanvue destination URL').fill(fanvueUrl)
    await paidPackageSection.getByLabel('Paid checklist').fill('verify destination\nexport notes')
    await paidPackageSection.getByRole('button', { name: 'Create Fanvue paid package' }).click()
    await expect(page.getByText(finalPaidTitle)).toBeVisible()

    await page.goto('/insights')
    await selectFirstRealOption(page.getByLabel('Public post package'))
    await selectFirstRealOption(page.getByLabel('Paid offer package'))
    await page.getByLabel('Public post URL').fill(postUrl)
    await page.getByLabel('Impressions').fill('1234')
    await page.getByLabel('Likes').fill('210')
    await page.getByLabel('Reposts').fill('21')
    await page.getByLabel('Replies').fill('5')
    await page.getByLabel('Bookmarks').fill('8')
    await page.getByLabel('Profile visits').fill('13')
    await page.getByLabel('Link clicks').fill('3')
    await page.getByLabel('Landing visits').fill('31')
    await page.getByLabel('Conversions').fill('4')
    await page.getByLabel('Renewals').fill('2')
    await page.getByLabel('Revenue').fill('49')
    await page.getByLabel('Operator memo').fill(`Browser funnel entry ${runId}`)
    await page.getByRole('button', { name: 'Record funnel metrics' }).click()
    await expect(page.getByRole('link', { name: postUrl })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('$49.00')).toBeVisible()
  })
})
