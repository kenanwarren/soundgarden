import { expect, test } from './fixtures'

test.describe('Learn flows', () => {
  test('learn hub routes explore filters and tools behind dedicated views', async ({ page }) => {
    await page.getByRole('link', { name: /^Learn/ }).click()

    await expect(page.getByRole('heading', { name: 'Learn' })).toBeVisible()
    await expect(page.getByText('Resume where you left off')).toBeVisible()
    await expect(page.getByText('Start from a style')).toBeVisible()
    await expect(page.getByText('Explore all paths')).toBeVisible()

    await page.getByRole('button', { name: 'Explore', exact: true }).click()
    await page.getByRole('button', { name: 'By skill' }).click()
    await page.getByRole('button', { name: 'Fingerstyle', exact: true }).click()

    await expect(page.getByText('Fingerstyle Paths')).toBeVisible()
    await expect(
      page.getByText(
        'Use alternating bass and arpeggio patterns to build steady fingerstyle motion.'
      )
    ).toBeVisible()

    await page.getByRole('button', { name: 'Tools', exact: true }).click()
    await expect(page.getByText('Open a direct learning tool')).toBeVisible()
    await expect(page.getByRole('link', { name: /Chord Library/i })).toBeVisible()
  })

  test('direct tool navigation opens the chord library from Learn', async ({ page }) => {
    await page.getByRole('link', { name: /^Learn/ }).click()
    await page.getByRole('button', { name: 'Tools', exact: true }).click()
    await page.getByRole('link', { name: /Chord Library/i }).click()

    await expect(page.getByRole('heading', { name: 'Chord Library' })).toBeVisible()
    await expect(page.getByText('Filtered voicings')).toBeVisible()
    await expect(page.getByText('Practice mode')).toBeVisible()
  })

  test('learn view query params restore explore filters', async ({ soundgarden }) => {
    const page = await soundgarden.gotoHash('#/learn?view=explore&browse=skill&skill=fingerstyle')

    await expect(page.getByRole('button', { name: 'Explore', exact: true })).toHaveClass(
      /bg-emerald-600/
    )
    await expect(page.getByRole('button', { name: 'By skill' })).toHaveClass(/bg-emerald-600/)
    await expect(page.getByRole('button', { name: 'Fingerstyle' })).toHaveClass(/bg-emerald-600/)
    await expect(page.getByText('Fingerstyle Paths')).toBeVisible()
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
