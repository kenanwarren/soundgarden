import { useEffect, useMemo, useState } from 'react'
import { Play, Square } from 'lucide-react'
import { PageHeader } from '../layout/PageHeader'
import { ChordDiagram } from '../common/ChordDiagram'
import { StaffRenderer } from '../common/StaffRenderer'
import { Tag } from './Tag'
import {
  getPreferredSongArrangement,
  getSongArrangements,
  getSongDifficultyLabel,
  SONGS,
  songMatchesDifficulty
} from '../../utils/songs'
import { CHORD_VOICINGS } from '../../utils/chord-voicings'
import { getVisibleGenres } from '../../utils/learn-data'
import { parseSongLine } from '../../utils/song-parser'
import { useNotationPlayback } from '../../hooks/useNotationPlayback'
import { formatDifficulty } from '../../utils/songs'
import type {
  DifficultyTier,
  GenreId,
  SongArrangement,
  SongDefinition
} from '../../utils/learn-types'

type SongViewMode = 'lyrics' | 'staff' | 'tab' | 'staff+tab'

const VIEW_MODES: Array<{ value: SongViewMode; label: string }> = [
  { value: 'lyrics', label: 'Lyrics' },
  { value: 'staff', label: 'Staff' },
  { value: 'tab', label: 'Tab' },
  { value: 'staff+tab', label: 'Staff+Tab' }
]

const DIFFICULTY_TIERS: DifficultyTier[] = ['Beginner', 'Intermediate', 'Advanced']

function SongCard({
  song,
  selected,
  onClick
}: {
  song: SongDefinition
  selected: boolean
  onClick: () => void
}): JSX.Element {
  const arrangementCount = getSongArrangements(song).length
  const difficultyLabel = getSongDifficultyLabel(song)

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
        selected
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
      }`}
    >
      <div className="text-sm font-medium text-white">{song.title}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-zinc-500">Key: {song.key}</span>
        <span className="text-xs text-zinc-600">·</span>
        <span className="text-xs text-zinc-500">{difficultyLabel}</span>
        {arrangementCount > 1 && (
          <>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-500">{arrangementCount} arrangements</span>
          </>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {song.genres.map((g) => (
          <Tag key={g} label={g} />
        ))}
      </div>
    </button>
  )
}

function SongLyrics({ lines }: { lines: SongArrangement['lines'] }): JSX.Element {
  const parsed = useMemo(() => lines.map(parseSongLine), [lines])

  return (
    <div className="space-y-1 font-mono text-sm leading-relaxed">
      {parsed.map((line, i) => {
        if (line.type === 'blank') return <div key={i} className="h-4" />
        if (line.type === 'section') {
          return (
            <div
              key={i}
              className="pb-1 pt-4 text-xs font-semibold uppercase tracking-widest text-zinc-500"
            >
              {line.label}
            </div>
          )
        }
        return (
          <div key={i} className="flex flex-wrap">
            {line.segments!.map((seg, j) => (
              <span key={j} className="inline-block">
                {seg.chord && (
                  <span className="block text-xs font-bold text-emerald-400">{seg.chord}</span>
                )}
                {!seg.chord && <span className="block text-xs">&nbsp;</span>}
                <span className="text-zinc-200 whitespace-pre">{seg.text}</span>
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function ChordReference({ chordNames }: { chordNames: string[] }): JSX.Element {
  const voicings = useMemo(
    () =>
      chordNames
        .map((name) => CHORD_VOICINGS.find((v) => v.name === name))
        .filter(Boolean) as typeof CHORD_VOICINGS,
    [chordNames]
  )

  if (voicings.length === 0) return <></>

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        Chords in this song
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        {voicings.map((v) => (
          <ChordDiagram key={v.name} voicing={v} size="sm" />
        ))}
      </div>
    </div>
  )
}

export function SongViewerPanel(): JSX.Element {
  const genres = useMemo(() => getVisibleGenres(), [])
  const [filterGenre, setFilterGenre] = useState<GenreId | 'all'>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyTier | 'all'>('all')
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [selectedArrangementId, setSelectedArrangementId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<SongViewMode>('lyrics')
  const { isPlaying, play, stop } = useNotationPlayback()

  const filtered = useMemo(
    () =>
      SONGS.filter((s) => {
        if (filterGenre !== 'all' && !s.genres.includes(filterGenre)) return false
        if (!songMatchesDifficulty(s, filterDifficulty)) return false
        return true
      }),
    [filterGenre, filterDifficulty]
  )

  const selectedSong = useMemo(
    () => (selectedSongId ? (SONGS.find((s) => s.id === selectedSongId) ?? null) : null),
    [selectedSongId]
  )

  const arrangements = useMemo(
    () => (selectedSong ? getSongArrangements(selectedSong) : []),
    [selectedSong]
  )

  const selectedArrangement = useMemo(
    () =>
      selectedSong
        ? getPreferredSongArrangement(selectedSong, filterDifficulty, selectedArrangementId)
        : null,
    [filterDifficulty, selectedArrangementId, selectedSong]
  )

  useEffect(() => {
    stop()
  }, [selectedArrangement?.id, selectedSongId, stop])

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <PageHeader
        title="Song Viewer"
        description="Browse public domain songs with chord charts, lyrics, and arrangement variants that can scale up in difficulty."
        backTo="/learn"
      />

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="flex flex-wrap gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Genre</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setFilterGenre('all')}
                className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                  filterGenre === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                All
              </button>
              {genres.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setFilterGenre(g.id)}
                  className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                    filterGenre === g.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {g.title}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Difficulty</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setFilterDifficulty('all')}
                className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                  filterDifficulty === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                All
              </button>
              {DIFFICULTY_TIERS.map((d) => (
                <button
                  key={d}
                  onClick={() => setFilterDifficulty(d)}
                  className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                    filterDifficulty === d
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex flex-col gap-2 overflow-auto rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-zinc-500">
              No songs match the current filters.
            </div>
          )}
          {filtered.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              selected={selectedSongId === song.id}
              onClick={() => {
                setSelectedSongId(song.id)
                setSelectedArrangementId(null)
              }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-6 overflow-auto">
          {selectedSong ? (
            <>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
                <div className="mb-1 flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">{selectedSong.title}</h2>
                  {selectedArrangement && (
                    <>
                      <Tag label={selectedArrangement.key} tone="accent" />
                      <Tag label={formatDifficulty(selectedArrangement.difficulty)} />
                      {!selectedArrangement.isDefault && <Tag label={selectedArrangement.label} />}
                    </>
                  )}
                </div>
                <div className="mb-4 text-xs text-zinc-500">
                  {selectedArrangement?.attribution ?? selectedSong.attribution}
                </div>

                {arrangements.length > 1 && selectedArrangement && (
                  <div className="mb-5">
                    <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Arrangement
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {arrangements.map((arrangement) => (
                        <button
                          key={arrangement.id}
                          onClick={() => setSelectedArrangementId(arrangement.id)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                            selectedArrangement.id === arrangement.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {arrangement.label} · {formatDifficulty(arrangement.difficulty)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {VIEW_MODES.map(({ value, label }) => {
                    const needsNotation = value !== 'lyrics'
                    const disabled = needsNotation && !selectedArrangement?.notation
                    return (
                      <button
                        key={value}
                        onClick={() => !disabled && setViewMode(value)}
                        disabled={disabled}
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                          viewMode === value
                            ? 'bg-emerald-600 text-white'
                            : disabled
                              ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}

                  {selectedArrangement?.notation && (
                    <button
                      onClick={() => (isPlaying ? stop() : play(selectedArrangement.notation!))}
                      className={`ml-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                        isPlaying
                          ? 'bg-red-600 text-white hover:bg-red-500'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Square size={10} />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play size={10} />
                          Play
                        </>
                      )}
                    </button>
                  )}
                </div>

                {viewMode === 'lyrics' ? (
                  <SongLyrics lines={selectedArrangement?.lines ?? selectedSong.lines} />
                ) : selectedArrangement?.notation ? (
                  <StaffRenderer
                    notation={selectedArrangement.notation}
                    songKey={selectedArrangement.key}
                    viewMode={viewMode}
                  />
                ) : (
                  <SongLyrics lines={selectedArrangement?.lines ?? selectedSong.lines} />
                )}
              </div>
              <ChordReference chordNames={selectedArrangement?.chords ?? selectedSong.chords} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/80">
              <div className="text-sm text-zinc-500">
                Select a song from the list to view lyrics and chords.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
