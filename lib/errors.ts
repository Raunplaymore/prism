export class AppError extends Error {
  code: string
  statusCode: number
  retryable: boolean

  constructor(message: string, code: string, statusCode: number, retryable = false) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.retryable = retryable
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      retryable: this.retryable,
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400, false)
    this.name = 'ValidationError'
  }
}

export class PlanLimitError extends AppError {
  constructor(message = 'Daily click limit reached. Upgrade your plan for unlimited access.') {
    super(message, 'PLAN_LIMIT', 402, false)
    this.name = 'PlanLimitError'
  }
}

export class AiServiceError extends AppError {
  constructor(message = 'Failed to fetch news from AI service.') {
    super(message, 'AI_SERVICE_ERROR', 502, true)
    this.name = 'AiServiceError'
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request timed out while fetching news.') {
    super(message, 'TIMEOUT_ERROR', 504, true)
    this.name = 'TimeoutError'
  }
}
