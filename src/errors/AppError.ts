export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CURRENT_PASSWORD_INVALID"
  | "NEW_PASSWORD_WEAK"
  | "NEW_PASSWORD_SAME_AS_OLD"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public status: number;
  public code: AppErrorCode;
  public fields?: Record<string, string>;

  constructor(opts: {
    status: number;
    code: AppErrorCode;
    message?: string;
    fields?: Record<string, string>;
  }) {
    super(opts.message ?? opts.code);
    this.status = opts.status;
    this.code = opts.code;
    this.fields = opts.fields;
  }
}
