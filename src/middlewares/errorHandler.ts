import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // AppError (controlado)
  if (err instanceof AppError) {
    return res.status(err.status).json({
      ok: false,
      code: err.code,
      error: err.message, // texto técnico (opcional)
      fields: err.fields ?? null,
    });
  }

  // Zod / validaciones (si quieres)
  // if (err instanceof ZodError) { ... }

  // Fallback
  console.error(err);
  return res.status(500).json({
    ok: false,
    code: "INTERNAL_ERROR",
    error: "Unexpected error",
  });
}
