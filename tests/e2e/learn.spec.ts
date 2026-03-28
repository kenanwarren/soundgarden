import { expect, test } from './fixtures'

test.describe('Learn flows', () => {
  test('learn home supports skill filtering while keeping tools visible', async ({ page }) => {
    await page.getByRole('link', { name: /^Learn/ }).click()

    await expect(page.getByRole('heading', { name: 'Learn' })).toBeVisible()
    await expect(page.getByText('Genre browser')).toBeVisible()
    await expect(page.getByText('Quick lookup still lives here.')).toBeVisible()

    await page.getByRole('button', { name: 'By skill' }).click()
    await page.getByRole('button', { name: 'Fingerstyle', exact: true }).click()

    await expect(page.getByText('Fingerstyle Paths')).toBeVisible()
    await expect(
      page.getByText(
        'Use alternating bass and arpeggio patterns to build steady fingerstyle motion.'
      )
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /Chord Library/i })).toBeVisible()
  })

  test('direct tool navigation opens the chord library from Learn', async ({ page }) => {
    await page.getByRole('link', { name: /^Learn/ }).click()
    await page.getByRole('link', { name: /Chord Library/i }).click()

    await expect(page.getByRole('heading', { name: 'Chord Library' })).toBeVisible()
    await expect(page.getByText('Filtered voicings')).toBeVisible()
    await expect(page.getByText('Practice mode')).toBeVisible()
  })

  test('audio-required drill routes show the offline gate instead of crashing', async ({
    page
  }) => {
    await page.evaluate(() => {
      window.location.hash = '#/learn/scale-sequences?lesson=funk-mixolydian-step'
    })

    await expect(page.getByRole('link', { name: 'Go to Setup' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open Settings' })).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: /needs live audio|Choose an input device first|Microphone permission is blocked/i
      })
    ).toBeVisible()
  })
})
