import type { FactoryPublishingExceptionLike, FactorySocialMediaErrorLike } from './factory-publishing.types'
import { UnrecoverableError } from 'bullmq'

export function isFactoryPublishingException(error: unknown): error is FactoryPublishingExceptionLike {
  return error instanceof Error && error.name === 'PublishingException'
}

export function isFactorySocialMediaError(error: unknown): error is FactorySocialMediaErrorLike {
  return error instanceof Error && error.name === 'SocialMediaError'
}

export class FactoryPublishingUnrecoverableError extends UnrecoverableError {
  readonly originalStack?: string
  override readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'FactoryPublishingUnrecoverableError'
    if (cause instanceof Error) {
      this.cause = cause
      this.originalStack = cause.stack
    }
  }
}
