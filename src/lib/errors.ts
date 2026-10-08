export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_ERROR"
  | "OUT_OF_STOCK"
  | "INVALID_COUPON"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly issues?: { path: string; message: string }[];

  constructor(
    code: ErrorCode,
    message: string,
    status = 400,
    issues?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.issues = issues;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, issues: { path: string; message: string }[]) {
    super("VALIDATION_ERROR", message, 422, issues);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class AppErrorBuilder {
  static outOfStock(message = "This product is out of stock"): AppError {
    return new AppError("OUT_OF_STOCK", message, 409);
  }

  static invalidCoupon(message: string): AppError {
    return new AppError("INVALID_COUPON", message, 400);
  }

  static payment(message: string): AppError {
    return new AppError("PAYMENT_ERROR", message, 502);
  }

  static rateLimited(message = "Too many requests, please try again later"): AppError {
    return new AppError("RATE_LIMITED", message, 429);
  }
}

export interface ErrorPayload {
  error: {
    code: ErrorCode;
    message: string;
    issues?: { path: string; message: string }[];
  };
}

/** Maps any thrown value to a safe API response (never leaks internals). */
export function toErrorPayload(error: unknown): { status: number; body: ErrorPayload } {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        error: { code: error.code, message: error.message, issues: error.issues },
      },
    };
  }
  console.error("[aras] unexpected error:", error);
  return {
    status: 500,
    body: {
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    },
  };
}
