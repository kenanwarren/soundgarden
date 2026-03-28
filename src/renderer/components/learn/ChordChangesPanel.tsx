import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { CHORD_VOICINGS } from '../../utils/chord-voicings'
import {
  CHORD_CHANGE_PRESETS,
  getChordChangePreset,
  getChordIndexByName
} from '../../utils/learn-data'
import { useLessonStep } from '../../hooks/useLessonStep'
import { useLearnProgressStore } from '../../stores/learn-progress-store'
import { useMetronomeStore } from '../../stores/metronome-store'
import { useMetronome } from '../../hooks/useMetronome'
import { useChordDetection } from '../../hooks/useChordDetection'
import { useChordStore } from '../../stores/chord-store'
import { matchesChordVoicing } from '../../utils/learn-drills'
import { PageHeader } from '../layout/PageHeader'
import { AudioRequiredState } from '../common/AudioRequiredState'
import { BpmControl } from '../common/BpmControl'
import { ChordDiagram } from '../common/ChordDiagram'
import { LearnSessionSummary } from './LearnSessionSummary'

function SummaryCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-medium text-white">{value}</div>
    </div>
  )
}

export function ChordChangesPanel(): JSX.Element {
  const lessonStep = useLessonStep('chord-changes')
  const recordSession = useLearnProgressStore((state) => state.recordSession)
  const savedSummary = useLearnProgressStore((state) => state.progress['chord-changes']?.lastSession)
  const sessionStartedAt = useRef<number | null>(null)
  const lastProcessedChord = useRef<string | null>(null)

  const [presetId, setPresetId] = useState('open-two')
  const [isRunning, setIsRunning] = useState(false)
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0)
  const [cleanSwitches, setCleanSwitches] = useState(0)
  const [mismatchCount, setMismatchCount] = useState(0)
  const [mismatches, setMismatches] = useState<string[]>([])

  const preset = getChordChangePreset(presetId) ?? getChordChangePreset('open-two')
  const targetVoicings = useMemo(
    () =>
      (preset?.chordNames ?? [])
        .map((name) => {
          const index = getChordIndexByName(name)
          return index === null ? null : CHORD_VOICINGS[index]
        })
        .filter((voicing): voicing is (typeof CHORD_VOICINGS)[number] => !!voicing),
    [preset]
  )
  const currentTarget = targetVoicings[currentTargetIndex] ?? null

  const { bpm, currentBeat, setBpm } = useMetronomeStore()
  const { tap, start: startMetronome, stop: stopMetronome } = useMetronome()
  const { start, stop, isConnected } = useChordDetection()
  const currentChord = useChordStore((state) => state.currentChord)

  const resetSessionState = useCallback(() => {
    setCurrentTargetIndex(0)
    setCleanSwitches(0)
    setMismatchCount(0)
    setMismatches([])
    lastProcessedChord.current = null
  }, [])

  useEffect(() => {
    if (!lessonStep || lessonStep.prefill.module !== 'chord-changes') return
    setPresetId(lessonStep.prefill.presetId)
    if (lessonStep.prefill.bpm) setBpm(lessonStep.prefill.bpm)
    resetSessionState()
  }, [lessonStep, resetSessionState, setBpm])

  const buildSummary = useCallback(() => {
    const attempts = cleanSwitches + mismatchCount
    const score = attempts > 0 ? (cleanSwitches / attempts) * 100 : 0

    return {
      module: 'chord-changes' as const,
      title: `${preset?.name ?? 'Chord changes'} session`,
      description: `Completed ${cleanSwitches} clean target changes at ${bpm} BPM.`,
      route: '/learn/chord-changes',
      score,
      bestStreak: cleanSwitches,
      completionState:
        cleanSwitches >= 4 ? 'completed' : attempts > 0 ? 'in-progress' : 'not-started',
      weakSpots: mismatches.slice(0, 4),
      presetId: preset?.id ?? presetId,
      presetName: preset?.name ?? 'Custom',
      cleanSwitches,
      mismatches,
      bpm
    }
  }, [bpm, cleanSwitches, mismatchCount, mismatches, preset, presetId])

  const finalizeSession = useCallback(() => {
    if (sessionStartedAt.current === null && cleanSwitches === 0 && mismatchCount === 0) return
    recordSession(buildSummary(), lessonStep?.id)
    sessionStartedAt.current = null
  }, [buildSummary, cleanSwitches, lessonStep?.id, mismatchCount, recordSession])

  const stopSession = useCallback(() => {
    finalizeSession()
    stop()
    stopMetronome()
    setIsRunning(false)
    sessionStartedAt.current = null
  }, [finalizeSession, stop, stopMetronome])

  useEffect(() => {
    if (!isRunning || !currentChord || !currentTarget) return
    if (currentChord.name === lastProcessedChord.current) return

    lastProcessedChord.current = currentChord.name

    const inTargetSet = targetVoicings.some((target) => matchesChordVoicing(target, currentChord))
    if (matchesChordVoicing(currentTarget, currentChord)) {
      setCleanSwitches((value) => value + 1)
      setCurrentTargetIndex((index) => (index + 1) % Math.max(targetVoicings.length, 1))
      return
    }

    if (!inTargetSet || currentChord.name !== currentTarget.name) {
      setMismatchCount((value) => value + 1)
      setMismatches((current) =>
        current.includes(currentChord.name) ? current : [...current, currentChord.name].slice(0, 8)
      )
    }
  }, [currentChord, currentTarget, isRunning, targetVoicings])

  useEffect(() => {
    return () => {
      finalizeSession()
    }
  }, [finalizeSession])

  const displayedSummary =
    cleanSwitches + mismatchCount > 0
      ? buildSummary()
      : savedSummary?.module === 'chord-changes'
        ? savedSummary
        : null

  if (!isConnected) {
    return <AudioRequiredState featureName="Chord changes training" />
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <PageHeader
        title="Chord Changes Trainer"
        description="Keep the metronome running, hit the highlighted chord cleanly, and only advance once Soundgarden hears the correct target."
        backTo="/learn"
        actions={
          <button
            onClick={() => {
              stop()
              stopMetronome()
              setIsRunning(false)
              finalizeSession()
              sessionStartedAt.current = null
              resetSessionState()
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw size={14} />
            Reset Session
          </button>
        }
      />

      {lessonStep && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          Guided step: <span className="font-medium text-white">{lessonStep.title}</span>.{' '}
          {lessonStep.description}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Preset" value={preset?.name ?? 'Unknown'} />
        <SummaryCard label="Next chord" value={currentTarget?.name ?? 'Pick a preset'} />
        <SummaryCard label="Clean switches" value={String(cleanSwitches)} />
        <SummaryCard label="Beat" value={String(currentBeat + 1)} />
      </div>

      <BpmControl bpm={bpm} setBpm={setBpm} onTap={tap} min={50} max={180} />

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="text-sm font-medium text-white">Progression preset</div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {CHORD_CHANGE_PRESETS.map((option) => {
            return (
              <button
                key={option.id}
                onClick={() => {
                  setPresetId(option.id)
                  resetSessionState()
                }}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  presetId === option.id
                    ? 'border-emerald-400/60 bg-emerald-600 text-white'
                    : 'border-zinc-800 bg-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <div className="text-sm font-medium">{option.name}</div>
                <div className="mt-1 text-xs opacity-75">{option.description}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {option.chordNames.map((name, index) => (
                    <span key={`${option.id}-${name}-${index}`} className="rounded-full bg-black/20 px-2 py-1 text-xs">
                      {name}
                    </span>
                  ))}
                </div>
                {option.toneSuggestions?.length ? (
                  <div className="mt-3 text-xs opacity-80">
                    Tone: {option.toneSuggestions[0]}
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="text-sm font-medium text-white">Target order</div>
          <div className="mt-4 flex flex-wrap gap-3">
            {targetVoicings.map((voicing, index) => (
              <div
                key={`${voicing.name}-${index}`}
                className={`rounded-2xl border p-3 ${
                  index === currentTargetIndex
                    ? 'border-emerald-400 bg-emerald-600/20'
                    : 'border-zinc-800 bg-zinc-950/70'
                }`}
              >
                <ChordDiagram voicing={voicing} size="sm" />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (isRunning) {
                  stopSession()
                  return
                }
                resetSessionState()
                sessionStartedAt.current = Date.now()
                setIsRunning(true)
                start()
                void startMetronome()
              }}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isRunning
                  ? 'bg-rose-600 text-white hover:bg-rose-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isRunning ? 'Stop Trainer' : 'Start Trainer'}
            </button>
            <span className="text-sm text-zinc-400">
              {isRunning
                ? currentTarget
                  ? `Play ${currentTarget.name} cleanly to advance.`
                  : 'Waiting for a target preset.'
                : 'Start the trainer to run the metronome and wait for the first target chord.'}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="text-sm font-medium text-white">Detection</div>
          <div className="mt-3 text-4xl font-semibold text-white">{currentChord?.name ?? '—'}</div>
          <p className="mt-2 text-sm text-zinc-400">
            {currentChord
              ? matchesChordVoicing(currentTarget ?? { root: '', quality: '' }, currentChord)
                ? 'Correct target detected. Move to the next chord.'
                : 'Detected chord is outside the current target.'
              : 'Strum the highlighted chord and let it settle.'}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current target</div>
              <div className="mt-2 text-lg font-medium text-white">{currentTarget?.name ?? '—'}</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Mismatches</div>
              <div className="mt-2 text-lg font-medium text-white">{mismatchCount}</div>
            </div>
          </div>
        </div>
      </div>

      {displayedSummary?.module === 'chord-changes' && (
        <LearnSessionSummary
          title={displayedSummary.title}
          description={displayedSummary.description}
          metrics={[
            {
              label: 'Clean switches',
              value: String(displayedSummary.cleanSwitches),
              tone: displayedSummary.cleanSwitches >= 4 ? 'good' : 'default'
            },
            {
              label: 'Preset',
              value: displayedSummary.presetName
            },
            {
              label: 'Score',
              value: `${Math.round(displayedSummary.score ?? 0)}%`,
              tone:
                (displayedSummary.score ?? 0) >= 80
                  ? 'good'
                  : (displayedSummary.score ?? 0) >= 50
                    ? 'warning'
                    : 'default'
            },
            { label: 'Tempo', value: `${displayedSummary.bpm} BPM` }
          ]}
          weakSpots={displayedSummary.weakSpots}
        />
      )}
    </div>
  )
}
