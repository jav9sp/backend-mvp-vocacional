import { Request, Response } from "express";
import { Op } from "sequelize";
import Enrollment from "../../models/Enrollment.model.js";
import User from "../../models/User.model.js";
import Attempt from "../../models/Attempt.model.js";
import InapResult from "../../models/InapResult.model.js";

export async function adminListEnrollments(req: Request, res: Response) {
  try {
    const { period } = req as any;
    if (!period) {
      return res.status(500).json({ ok: false, error: "Period not loaded" });
    }

    // 1) Enrollment + Student (include)
    const enrollments = await Enrollment.findAll({
      where: { periodId: period.id },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "name", "email", "role"],
          required: false,
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const studentIds = Array.from(
      new Set(enrollments.map((e) => e.studentUserId)),
    );

    // 2) Attempts del periodo para esos alumnos (no "latest": es el del periodId)
    const attempts = studentIds.length
      ? await Attempt.findAll({
          where: {
            userId: { [Op.in]: studentIds },
            periodId: period.id, // ✅ clave
          },
          attributes: [
            "id",
            "userId",
            "status",
            "answeredCount",
            "finishedAt",
            "createdAt",
          ],
        })
      : [];

    // Si por alguna razón hay más de 1 attempt por user+period, nos quedamos con el más nuevo
    attempts.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    const attemptByUserId = new Map<number, Attempt>();
    for (const a of attempts) {
      if (!attemptByUserId.has(a.userId)) attemptByUserId.set(a.userId, a);
    }

    // 3) Results por attemptId
    const attemptIds = Array.from(attemptByUserId.values()).map((a) => a.id);

    const results = attemptIds.length
      ? await InapResult.findAll({
          where: { attemptId: { [Op.in]: attemptIds } },
          attributes: ["attemptId", "topAreas", "createdAt"],
        })
      : [];

    const resultByAttemptId = new Map(results.map((r) => [r.attemptId, r]));

    const rows = enrollments.map((enr) => {
      const student = (enr as any).student as User | undefined;
      const attempt = attemptByUserId.get(enr.studentUserId) ?? null;
      const result = attempt
        ? (resultByAttemptId.get(attempt.id) ?? null)
        : null;

      let progressStatus: "not_started" | "in_progress" | "finished" =
        "not_started";
      if (attempt?.status === "in_progress") progressStatus = "in_progress";
      if (attempt?.status === "finished") progressStatus = "finished";

      return {
        enrollment: {
          id: enr.id,
          status: enr.status,
          meta: enr.meta,
          createdAt: enr.createdAt,
        },
        student: student
          ? { id: student.id, name: student.name, email: student.email }
          : { id: enr.studentUserId, name: "(missing user)", email: null },
        attempt: attempt
          ? {
              id: attempt.id,
              status: attempt.status,
              answeredCount: attempt.answeredCount,
              finishedAt: attempt.finishedAt,
            }
          : null,
        result: result
          ? { topAreas: result.topAreas, createdAt: result.createdAt }
          : null,
        progressStatus,
      };
    });

    return res.json({
      ok: true,
      period: {
        id: period.id,
        name: period.name,
        status: period.status,
        testId: period.testId,
      },
      enrollments: rows,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Unexpected error",
      detail: String(err),
    });
  }
}
