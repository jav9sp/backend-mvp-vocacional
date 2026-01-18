import { Request, Response } from "express";
import Enrollment from "../models/Enrollment.model.js";
import User from "../models/User.model.js";
import Attempt from "../models/Attempt.model.js";
import Result from "../models/Result.model.js";

export async function adminListEnrollments(req: Request, res: Response) {
  const { period } = req;
  if (!period) {
    return res.status(500).json({ message: "Period not loaded" });
  }

  const enrollments = await Enrollment.findAll({
    where: { id: period.id },
    order: [["createdAt", "ASC"]],
  });

  const studentIds = enrollments.map((e) => e.studentUserId);

  const students = await User.findAll({
    where: { id: studentIds },
    attributes: ["id", "name", "email", "role"],
  });
  const studentById = new Map(students.map((s) => [s.id, s]));

  const attempts = await Attempt.findAll({
    where: { userId: studentIds, testId: period.testId },
    attributes: [
      "id",
      "userId",
      "status",
      "answeredCount",
      "finishedAt",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });

  // Map: userId -> latest attempt
  const latestAttemptByUserId = new Map<number, Attempt>();
  for (const a of attempts) {
    if (!latestAttemptByUserId.has(a.userId))
      latestAttemptByUserId.set(a.userId, a);
  }

  // Buscar results para esos attempts
  const attemptIds = Array.from(latestAttemptByUserId.values()).map(
    (a) => a.id,
  );
  const results = attemptIds.length
    ? await Result.findAll({
        where: { attemptId: attemptIds },
        attributes: ["attemptId", "topAreas", "createdAt"],
      })
    : [];
  const resultByAttemptId = new Map(results.map((r) => [r.attemptId, r]));

  const rows = enrollments.map((enr) => {
    const student = studentById.get(enr.studentUserId);
    const attempt = latestAttemptByUserId.get(enr.studentUserId);
    const result = attempt ? resultByAttemptId.get(attempt.id) : null;

    // estado para UI
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
}
