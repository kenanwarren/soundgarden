import type { Locator, Page } from '@playwright/test'
import { expect, persistedState, test } from './fixtures'

function diagnosticsSection(page: Page): Locator {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Diagnostics', exact: true }) })
}

function settingsStatusValue(page: Page, label: string): Locator {
  return diagnosticsSection(page)
    .getByText(label, { exact: true })
    .locator('xpath=following-sibling::div[1]')
}

function statusStripValue(page: Page, value: string): Locator {
  return page.locator('span.font-medium', {
    hasText: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  })
}

function appSettingsState(
  overrides: {
    audio?: Record<string, unknown>
    practice?: Record<string, unknown>
    interface?: Record<string, unknown>
  } = {}
): string {
  return persistedState({
    audio: {
      inputDeviceId: null,
      outputDeviceId: null,
      masterVolume: 0.8,
      autoReconnect: true,
      monitoringEnabled: true,
      ...overrides.audio
    },
    practice: {
      referenceA4: 440,
      tuningPreset: 'Standard',
      metronomeBpm: 120,
      metronomeBeatsPerMeasure: 4,
      metronomeAccentFirst: true,
      ...overrides.practice
    },
    interface: {
      showTooltips: true,
      reducedMotion: false,
      compactControls: false,
      ...overrides.interface
    }
  })
}

test.describe('Audio mode flows', () => {
  test('audio-required routes show the correct gate variants', async ({ soundgarden }) => {
    let page = await soundgarden.relaunch({ audioMode: 'permission-denied' })
    await soundgarden.gotoHash('#/learn/scale-sequences?lesson=funk-mixolydian-step')

    await expect(
      page.getByRole('heading', { name: 'Microphone permission is blocked' })
    ).toBeVisible()
    await expect(
      page.getByText(
        'Soundgarden cannot use live audio until microphone access is granted in system settings.'
      )
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reconnect' })).toHaveCount(0)

    await soundgarden.clearStorage({ reload: false })
    page = await soundgarden.relaunch({ audioMode: 'offline-no-input' })
    await soundgarden.gotoHash('#/learn/scale-sequences?lesson=funk-mixolydian-step')

    await expect(page.getByRole('heading', { name: 'Choose an input device first' })).toBeVisible()
    await expect(
      page.getByText('Pick the guitar interface or microphone you want to use, then reconnect.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reconnect' })).toHaveCount(0)

    await soundgarden.clearStorage({ reload: false })
    page = await soundgarden.relaunch({ audioMode: 'offline-selected-input' })
    await soundgarden.gotoHash('#/learn/scale-sequences?lesson=funk-mixolydian-step')

    await expect(
      page.getByRole('heading', { name: 'Scale sequence training needs live audio' })
    ).toBeVisible()
    await expect(
      page.getByText('Connect an input device on the Setup page to start using this tool.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reconnect' })).toBeVisible()
  })

  test('connected audio mode renders the live shell instead of gates', async ({ soundgarden }) => {
    const page = await soundgarden.relaunch({ audioMode: 'connected' })

    await expect(statusStripValue(page, 'Connected')).toBeVisible()
    await expect(statusStripValue(page, 'E2E USB Interface')).toBeVisible()
    await expect(statusStripValue(page, 'E2E Studio Monitors')).toBeVisible()
    await expect(statusStripValue(page, 'Good (12.0ms)')).toBeVisible()
    await expect(statusStripValue(page, 'Healthy')).toBeVisible()
    await expect(statusStripValue(page, 'Live Input')).toBeVisible()

    await expect(page.getByText('Ready to play')).toBeVisible()

    await soundgarden.gotoHash('#/tuner')
    await expect(page.getByRole('heading', { name: 'Tuner' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Target tuning' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /needs live audio/i })).toHaveCount(0)

    await soundgarden.gotoHash('#/effects')
    await expect(page.getByRole('heading', { name: 'Effects' })).toBeVisible()
    await expect(page.getByText('Signal chain', { exact: true })).toBeVisible()

    await soundgarden.gotoHash('#/chords')
    await expect(page.getByRole('heading', { name: 'Chord Recognition' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Detection' })).toBeVisible()
  })

  test('settings diagnostics handle connected success and saved-device warnings', async ({
    soundgarden
  }) => {
    let page = await soundgarden.relaunch({ audioMode: 'connected' })
    await soundgarden.gotoHash('#/settings')

    await page.getByRole('button', { name: 'Run Audio Check' }).click()

    await expect(
      diagnosticsSection(page).getByText('Audio check passed. Soundgarden is ready for live input.')
    ).toBeVisible()
    await expect(page.getByText('Audio check passed', { exact: true })).toBeVisible()
    await expect(
      diagnosticsSection(page).getByText('Input route: E2E USB Interface.')
    ).toBeVisible()
    await expect(
      diagnosticsSection(page).getByText('Live audio is connected with healthy signal.')
    ).toBeVisible()

    await soundgarden.seedStorage(
      {
        'soundgarden-app-settings': appSettingsState({
          audio: {
            inputDeviceId: 'missing-input',
            outputDeviceId: null,
            autoReconnect: true
          }
        })
      },
      { reload: false }
    )

    page = await soundgarden.relaunch({ audioMode: 'connected' })
    await soundgarden.gotoHash('#/')

    await expect(
      page.getByText('Your saved input device is unavailable. Select another input to continue.')
    ).toBeVisible()

    await soundgarden.gotoHash('#/settings')
    await page.getByRole('button', { name: 'Run Audio Check' }).click()

    await expect(
      diagnosticsSection(page).getByText('Audio check found a few setup issues to resolve.')
    ).toBeVisible()
    await expect(diagnosticsSection(page).getByText('No input device is selected.')).toBeVisible()
    await expect(settingsStatusValue(page, 'Connection')).toHaveText('Disconnected')
  })
})
