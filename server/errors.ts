import { ZodError } from "zod";

export class EvidenceError extends Error {
  override name = "EvidenceError";
}

export function errorResponse(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof ZodError)
    return {
      status: 400,
      message: error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    };
  if (error instanceof EvidenceError)
    return { status: 400, message: error.message };
  if (
    error instanceof SyntaxError &&
    "type" in error &&
    error.type === "entity.parse.failed"
  )
    return { status: 400, message: "Request body must be valid JSON." };
  if (
    error instanceof Error &&
    "type" in error &&
    error.type === "entity.too.large"
  )
    return { status: 413, message: "Request body is too large." };
  return {
    status: 500,
    message: "An internal server error occurred. Check the server log.",
  };
}
