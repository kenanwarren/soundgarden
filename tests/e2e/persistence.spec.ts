import type { Locator, Page } from '@playwright/test'
import { expect, persistedState, test } from './fixtures'

function settingsSection(page: Page, title: string): Locator {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
}

function chordFilterButton(page: Page, groupLabel: 'Root' | 'Type', buttonName: string): Locator {
  return page
    .getByText(groupLabel, { exact: true })
    .locator('xpath=following-sibling::div[1]')
    .getByRole('button', { name: buttonName, exact: true })
}

function summaryCardValue(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator('xpath=following-sibling::div[1]')
}

function continueCardValue(page: Page, label: 'Context' | 'Best score' | 'Best streak'): Locator {
  return page.getByText(label, { exact: true }).first().locator('xpath=following-sibling::div[1]')
}

test.describe('Persistence and routing flows', () => {
  test('settings persist across relaunch and reset back to defaults', async ({ soundgarden }) => {
    let page = await soundgarden.gotoHash('#/settings')

    let audioSection = settingsSection(page, 'Audio')
    let practiceSection = settingsSection(page, 'Practice Defaults')
    let interfaceSection = settingsSection(page, 'Interface')

    await page.getByLabel(/Auto reconnect/i).uncheck()
    await page.getByLabel(/^Monitoring/i).uncheck()
    await page.getByLabel(/Reduced motion/i).check()
    await page.getByLabel(/Compact controls/i).check()

    await practiceSection.locator('input[type="range"]').first().fill('435')
    await practiceSection.getByRole('button', { name: /^Drop D/i }).click()
    await practiceSection.getByRole('spinbutton').fill('146')
    await practiceSection.getByRole('button', { name: '6/4' }).click()
    await page.getByLabel(/Accent the first beat/i).uncheck()

    page = await soundgarden.relaunch()
    await soundgarden.gotoHash('#/settings')

    audioSection = settingsSection(page, 'Audio')
    practiceSection = settingsSection(page, 'Practice Defaults')
    interfaceSection = settingsSection(page, 'Interface')

    const appShell = page.locator('div.flex.h-screen').first()

    await expect(page.getByLabel(/Auto reconnect/i)).not.toBeChecked()
    await expect(page.getByLabel(/^Monitoring/i)).not.toBeChecked()
    await expect(page.getByLabel(/Reduced motion/i)).toBeChecked()
    await expect(page.getByLabel(/Compact controls/i)).toBeChecked()
    await expect(page.getByLabel(/Accent the first beat/i)).not.toBeChecked()
    await expect(practiceSection.getByText('435 Hz')).toBeVisible()
    await expect(practiceSection.getByRole('spinbutton')).toHaveValue('146')
    await expect(practiceSection.getByRole('button', { name: /^Drop D/i })).toHaveClass(
      /border-emerald-500\/40/
    )
    await expect(practiceSection.getByRole('button', { name: '6/4' })).toHaveClass(/bg-emerald-600/)
    await expect(appShell).toHaveClass(/reduce-motion/)
    await expect(page.locator('aside')).toHaveClass(/w-64/)

    await audioSection.getByRole('button', { name: 'Reset' }).click()
    await expect(page.getByText('Audio settings reset')).toBeVisible()
    await expect(page.getByLabel(/Auto reconnect/i)).toBeChecked()
    await expect(page.getByLabel(/^Monitoring/i)).toBeChecked()

    await practiceSection.getByRole('button', { name: 'Reset' }).click()
    await expect(page.getByText('Practice defaults reset')).toBeVisible()
    await expect(practiceSection.getByText('440 Hz')).toBeVisible()
    await expect(practiceSection.getByRole('spinbutton')).toHaveValue('120')
    await expect(practiceSection.getByRole('button', { name: /^Standard/i })).toHaveClass(
      /border-emerald-500\/40/
    )
    await expect(practiceSection.getByRole('button', { name: '4/4' })).toHaveClass(/bg-emerald-600/)
    await expect(page.getByLabel(/Accent the first beat/i)).toBeChecked()

    await interfaceSection.getByRole('button', { name: 'Reset' }).click()
    await expect(page.getByText('Interface settings reset')).toBeVisible()
    await expect(page.getByLabel(/Reduced motion/i)).not.toBeChecked()
    await expect(page.getByLabel(/Compact controls/i)).not.toBeChecked()
    await expect(appShell).not.toHaveClass(/reduce-motion/)
    await expect(page.locator('aside')).toHaveClass(/w-72/)
  })

  test('learn hub resumes the last persisted session', async ({ soundgarden }) => {
    await soundgarden.seedStorage({
      'soundgarden-learn-progress': persistedState({
        progress: {
          'scale-explorer': {
            id: 'scale-explorer',
            attempts: 3,
            lastPracticedAt: 1_700_000_000_000,
            bestScore: 91,
            bestStreak: 12,
            completionState: 'completed',
            weakSpots: ['Blue note timing', 'Descending run'],
            lastSession: {
              module: 'scale-explorer',
              title: 'A blues scale session',
              description: 'Covered the A blues box with a full-note pass.',
              route: '/learn/scales',
              resumeHref: '/learn/scales?root=A&scale=Blues',
              contextLabel: 'A Blues',
              score: 91,
              bestStreak: 12,
              completionState: 'completed',
              weakSpots: ['Blue note timing', 'Descending run'],
              notesHit: 6,
              totalNotes: 6,
              timeSpentMs: 52_000,
              missedNotes: [],
              root: 'A',
              scaleName: 'Blues'
            }
          }
        },
        completedSteps: {
          'foundations-setup': 1_700_000_000_000
        }
      })
    })

    const page = await soundgarden.gotoHash('#/learn')

    await expect(page.getByText('A blues scale session')).toBeVisible()
    await expect(page.getByText('Covered the A blues box with a full-note pass.')).toBeVisible()
    await expect(continueCardValue(page, 'Context')).toHaveText('A Blues')
    await expect(continueCardValue(page, 'Best score')).toHaveText('91%')
    await expect(continueCardValue(page, 'Best streak')).toHaveText('12')

    await page.getByRole('link', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Scale Explorer' })).toBeVisible()
    await expect(summaryCardValue(page, 'Scale')).toHaveText('A Blues')
  })

  test('guided lesson deep links override persisted scale and chord filters', async ({
    soundgarden
  }) => {
    await soundgarden.seedStorage({
      'soundgarden-scales': persistedState({
        selectedRoot: 'C',
        selectedScaleIndex: 0
      }),
      'soundgarden-chord-library': persistedState({
        filterRoot: 'G',
        filterCategory: 'barre'
      })
    })

    const page = await soundgarden.gotoHash('#/learn/scales?lesson=foundations-minor-pentatonic')

    await expect(page.getByText(/Guided step:/).first()).toBeVisible()
    await expect(page.getByText('Minor Pentatonic Map')).toBeVisible()
    await expect(summaryCardValue(page, 'Scale')).toHaveText('A Minor Pentatonic')

    await soundgarden.gotoHash('#/learn/chords?lesson=rock-power-focus')

    await expect(page.getByText('Power Chord Focus')).toBeVisible()
    await expect(summaryCardValue(page, 'Selected chord')).toHaveText('E5')
    await expect(chordFilterButton(page, 'Root', 'E')).toHaveClass(/bg-emerald-600/)
    await expect(chordFilterButton(page, 'Type', 'Open')).toHaveClass(/bg-emerald-600/)
  })

  test('chord library filters persist across relaunch and clear back to all', async ({
    soundgarden
  }) => {
    let page = await soundgarden.gotoHash('#/learn/chords')

    await chordFilterButton(page, 'Root', 'E').click()
    await chordFilterButton(page, 'Type', 'Open').click()

    page = await soundgarden.relaunch()
    await soundgarden.gotoHash('#/learn/chords')

    await expect(chordFilterButton(page, 'Root', 'E')).toHaveClass(/bg-emerald-600/)
    await expect(chordFilterButton(page, 'Type', 'Open')).toHaveClass(/bg-emerald-600/)

    await page.getByRole('button', { name: 'Clear Filters' }).click()

    await expect(chordFilterButton(page, 'Root', 'All')).toHaveClass(/bg-emerald-600/)
    await expect(chordFilterButton(page, 'Type', 'All')).toHaveClass(/bg-emerald-600/)
    await expect(chordFilterButton(page, 'Root', 'E')).not.toHaveClass(/bg-emerald-600/)
    await expect(chordFilterButton(page, 'Type', 'Open')).not.toHaveClass(/bg-emerald-600/)
  })
})
