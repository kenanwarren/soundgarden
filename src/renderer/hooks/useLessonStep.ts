import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLessonStep } from '../utils/learn-data'
import type { LearnModuleId, LessonStep } from '../utils/learn-types'

export function useLessonStep(module: LearnModuleId): LessonStep | null {
  const [searchParams] = useSearchParams()
  const lessonId = searchParams.get('lesson')

  return useMemo(() => {
    const step = getLessonStep(lessonId)
    return step?.module === module ? step : null
  }, [lessonId, module])
}
