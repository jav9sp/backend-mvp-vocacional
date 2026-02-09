import { z } from "zod";

export const SaveCaasAnswersBodySchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive(),
        value: z.number().int().min(1).max(5),
      })
    )
    .min(1)
    .max(24), // 24 preguntas cerradas
  answeredCount: z.number().int().min(0).max(24).optional(),
});

export const SaveCaasOpenAnswersBodySchema = z.object({
  openAnswers: z.array(
    z.object({
      questionKey: z.enum(["future_vision", "doubts", "curiosities"]),
      answerText: z.string().max(2000).nullable(),
    })
  ),
});

export type SaveCaasAnswersBody = z.infer<typeof SaveCaasAnswersBodySchema>;
export type SaveCaasOpenAnswersBody = z.infer<typeof SaveCaasOpenAnswersBodySchema>;
