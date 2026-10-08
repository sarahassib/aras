import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";
import { AppErrorBuilder, ValidationError, toErrorPayload } from "./errors";
import { rateLimit, clientIp } from "./rate-limit";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(error: unknown): NextResponse {
  const { status, body } = toErrorPayload(error);
  const headers = new Headers();
  if (status === 429) headers.set("Retry-After", "60");
  return NextResponse.json(body, { status, headers });
}

/** Wraps a route handler with uniform error handling. */
export async function apiRoute(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    return errorResponse(error);
  }
}

export async function readBody<T>(request: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON body", [
      { path: "", message: "Request body must be valid JSON" },
    ]);
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(
      "Validation failed",
      result.error.issues.map((issue) => ({
        path: issue.path.join(".") || "body",
        message: issue.message,
      })),
    );
  }
  return result.data;
}

/** Sliding-window rate limit keyed by route + client IP. */
export function enforceRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): void {
  const result = rateLimit(`${scope}:${clientIp(request)}`, limit, windowMs);
  if (!result.ok) {
    throw AppErrorBuilder.rateLimited(
      `Too many requests — try again in ${result.retryAfterSeconds}s`,
    );
  }
}

export function intQuery(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
