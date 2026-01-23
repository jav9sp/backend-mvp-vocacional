import { Request, Response } from "express";
import Enrollment from "../../models/Enrollment.model.js";
import User from "../../models/User.model.js";
import Attempt from "../../models/Attempt.model.js";
import InapResult from "../../models/InapResult.model.js";
import { areaName } from "../../utils/inapv-areas.js";

function csvEscape(v: any) {
  const s = (v ?? "").toString();
  // escapa comillas y envuelve si hay coma o salto
  const escaped = s.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export async function adminExportPeriodCSV(req: Request, res: Response) {
  const { period } = req;
  if (!period) {
    return res.status(500).json({ ok: false, error: "Period not loaded" });
  }

  const enrollments = await Enrollment.findAll({
    where: { id: period.id },
    order: [["createdAt", "ASC"]],
  });

  const studentIds = enrollments.map((e) => e.studentUserId);

  const students = await User.findAll({
    where: { id: studentIds },
    attributes: ["id", "name", "email"],
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

  const latestAttemptByUserId = new Map<number, Attempt>();
  for (const a of attempts) {
    if (!latestAttemptByUserId.has(a.userId))
      latestAttemptByUserId.set(a.userId, a);
  }

  const attemptIds = Array.from(latestAttemptByUserId.values()).map(
    (a) => a.id,
  );
  const results = attemptIds.length
    ? await InapResult.findAll({
        where: { attemptId: attemptIds },
        attributes: ["attemptId", "topAreas"],
      })
    : [];
  const resultByAttemptId = new Map(results.map((r) => [r.attemptId, r]));

  // header CSV
  const header = [
    "student_id",
    "name",
    "email",
    "course",
    "progress_status",
    "answered_count",
    "attempt_id",
    "attempt_status",
    "top_areas",
  ];

  const lines: string[] = [];
  lines.push(header.join(","));

  for (const enr of enrollments) {
    const student = studentById.get(enr.studentUserId);
    const attempt = latestAttemptByUserId.get(enr.studentUserId);
    const result = attempt ? resultByAttemptId.get(attempt.id) : null;

    let progressStatus: "not_started" | "in_progress" | "finished" =
      "not_started";
    if (attempt?.status === "in_progress") progressStatus = "in_progress";
    if (attempt?.status === "finished") progressStatus = "finished";

    const course =
      (enr.meta &&
        (enr.meta.course ||
          enr.meta.curso ||
          enr.meta.classroom ||
          enr.meta.grade)) ||
      "";

    const row = [
      enr.studentUserId,
      student?.name || "",
      student?.email || "",
      course,
      progressStatus,
      attempt?.answeredCount ?? "",
      attempt?.id ?? "",
      attempt?.status ?? "",
      result?.topAreas?.map(areaName).join(" | ") ?? "",
    ];

    lines.push(row.map(csvEscape).join(","));
  }

  const safe = period.name.replace(/[^\w\-]+/g, "_");
  const filename = `period_${period.id}_${safe}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(lines.join("\n"));
}
