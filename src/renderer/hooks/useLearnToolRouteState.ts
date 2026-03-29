import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { buildRouteWithParams, getGenreDefinition } from '../utils/learn-data'
import type { GenreId, LearnModuleId, LearnToolRouteState } from '../utils/learn-types'
import { useLessonStep } from './useLessonStep'

export function useLearnToolRouteState(
  module: LearnModuleId,
  baseRoute: string
): LearnToolRouteState {
  const [searchParams] = useSearchParams()
  const lessonStep = useLessonStep(module)
  const rawGenreContext = searchParams.get('genre')
  const genreContext =
    rawGenreContext && getGenreDefinition(rawGenreContext as GenreId)
      ? (rawGenreContext as GenreId)
      : null
  const genreLabel = genreContext ? (getGenreDefinition(genreContext)?.title ?? null) : null

  const buildResumeHref = useCallback(
    (params: Record<string, string | number | null | undefined> = {}) =>
      lessonStep
        ? buildRouteWithParams(baseRoute, { lesson: lessonStep.id })
        : buildRouteWithParams(baseRoute, { ...params, genre: genreContext }),
    [baseRoute, genreContext, lessonStep]
  )

  return {
    searchParams,
    lessonStep,
    genreContext,
    genreLabel,
    buildResumeHref
  }
}
