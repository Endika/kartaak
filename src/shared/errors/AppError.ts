export class AppError extends Error {
  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.cause = cause;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AIGenerationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'AIGenerationError';
  }
}
