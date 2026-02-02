import { z } from "zod";

export const favoritePayloadSchema = z.object({
  admissionProcessId: z.coerce.number().int(),
  demreCode: z.coerce.number().int(),
});

export const addFavoriteSchema = z.object({
  admissionProcessId: z.coerce.number().int(),
  demreCode: z.coerce.number().int(),
});

export const favoriteParamsSchema = z.object({
  admissionProcessId: z.coerce.number().int(),
  demreCode: z.coerce.number().int(),
});

export const okRespSchema = z.object({
  ok: z.boolean(),
});

export const favoriteRowSchema = z.object({
  admissionProcessId: z.number().int(),
  demreCode: z.number().int(),
  createdAt: z.string().or(z.date()).optional(),
});

export const favoriteListRespSchema = z.object({
  ok: z.boolean(),
  data: z.array(favoriteRowSchema),
});

export type AddFavoriteBody = z.infer<typeof addFavoriteSchema>;
