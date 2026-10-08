import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

interface PrismaKnownError {
  code?: string;
  meta?: { target?: unknown; constraint?: string };
  message?: string;
}

function isPrismaError(error: unknown): error is Error & { code?: string; meta?: unknown } {
  return (
    error instanceof Error &&
    typeof (error as PrismaKnownError).code === "string"
  );
}

/** Translates Prisma known errors (P2002/P2025/P2003…) into AppErrors. */
export function prismaErrorToAppError(error: unknown): unknown {
  if (!isPrismaError(error)) return error;

  switch (error.code) {
    case "P2002": {
      const target = (error.meta as { target?: unknown } | undefined)?.target;
      const field = Array.isArray(target) ? target.join(", ") : "unique field";
      return new ConflictError(`A record with this ${field} already exists`);
    }
    case "P2025":
      return new NotFoundError(error.message || "Record not found");
    case "P2003": {
      const target = (error.meta as { target?: unknown } | undefined)?.target;
      const field = Array.isArray(target) ? target.join(", ") : "related record";
      return new ValidationError(`Invalid reference: ${field}`, [
        { path: field, message: "Referenced record is missing or still in use" },
      ]);
    }
    default:
      return error;
  }
}

/** Wraps a service call so Prisma errors surface as friendly API errors. */
export async function withPrismaErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw prismaErrorToAppError(error);
  }
}
