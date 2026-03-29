import { useCallback, useEffect, useRef, type MutableRefObject } from 'react'
import { useLearnProgressStore } from '../stores/learn-progress-store'
import type { SessionSummary } from '../utils/learn-types'

interface UseLearnSessionOptions<TSummary extends SessionSummary> {
  module: TSummary['module']
  lessonStepId?: string | null
  sessionKey?: string | null
  hasActivity: () => boolean
  buildSummary: () => TSummary
  sessionStartedAtRef?: MutableRefObject<number | null>
}

export function useLearnSession<TSummary extends SessionSummary>({
  module,
  lessonStepId = null,
  sessionKey = null,
  hasActivity,
  buildSummary,
  sessionStartedAtRef: providedSessionStartedAtRef
}: UseLearnSessionOptions<TSummary>) {
  const recordSession = useLearnProgressStore((state) => state.recordSession)
  const savedSummary = useLearnProgressStore((state) => {
    const summary = state.progress[module]?.lastSession
    return summary?.module === module ? (summary as TSummary) : null
  })

  const fallbackSessionStartedAtRef = useRef<number | null>(null)
  const sessionStartedAtHandleRef = useRef<MutableRefObject<number | null>>(
    providedSessionStartedAtRef ?? fallbackSessionStartedAtRef
  )
  const hasActivityRef = useRef(hasActivity)
  const buildSummaryRef = useRef(buildSummary)
  const resolvedSessionKey = lessonStepId ? `lesson:${lessonStepId}` : sessionKey
  const activeLessonStepIdRef = useRef<string | null>(lessonStepId)
  const activeSessionKeyRef = useRef<string | null>(resolvedSessionKey)

  useEffect(() => {
    sessionStartedAtHandleRef.current = providedSessionStartedAtRef ?? fallbackSessionStartedAtRef
  }, [providedSessionStartedAtRef])

  useEffect(() => {
    hasActivityRef.current = hasActivity
  }, [hasActivity])

  useEffect(() => {
    buildSummaryRef.current = buildSummary
  }, [buildSummary])

  useEffect(() => {
    activeLessonStepIdRef.current = lessonStepId
  }, [lessonStepId])

  const resetSessionStart = useCallback(() => {
    sessionStartedAtHandleRef.current.current = null
  }, [])

  const finalizeSession = useCallback(
    (overrideLessonStepId?: string | null) => {
      if (!hasActivityRef.current()) return
      recordSession(
        buildSummaryRef.current(),
        overrideLessonStepId ?? activeLessonStepIdRef.current
      )
      resetSessionStart()
    },
    [recordSession, resetSessionStart]
  )

  useEffect(() => {
    if (activeSessionKeyRef.current === resolvedSessionKey) return
    finalizeSession(activeLessonStepIdRef.current)
    resetSessionStart()
    activeLessonStepIdRef.current = lessonStepId
    activeSessionKeyRef.current = resolvedSessionKey
  }, [finalizeSession, lessonStepId, resetSessionStart, resolvedSessionKey])

  useEffect(() => {
    return () => {
      finalizeSession(activeLessonStepIdRef.current)
    }
  }, [finalizeSession])

  const startSession = useCallback(() => {
    if (sessionStartedAtHandleRef.current.current === null) {
      sessionStartedAtHandleRef.current.current = Date.now()
    }
  }, [])

  return {
    savedSummary,
    startSession,
    resetSessionStart,
    finalizeSession
  }
}
