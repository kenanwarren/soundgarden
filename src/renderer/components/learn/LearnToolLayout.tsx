import type { ReactNode } from 'react'
import type { LessonStep } from '../../utils/learn-types'
import { PageHeader } from '../layout/PageHeader'
import { GuidedStepBanner } from './GuidedStepBanner'

interface LearnToolLayoutProps {
  title: string
  description: string
  actions?: ReactNode
  lessonStep?: LessonStep | null
  children: ReactNode
}

export function LearnToolLayout({
  title,
  description,
  actions,
  lessonStep,
  children
}: LearnToolLayoutProps): JSX.Element {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <PageHeader title={title} description={description} backTo="/learn" actions={actions} />
      {lessonStep && (
        <GuidedStepBanner title={lessonStep.title} description={lessonStep.description} />
      )}
      {children}
    </div>
  )
}
