import { Request, Response } from "express";
import { Op, fn, col, literal, Sequelize } from "sequelize";
import Enrollment from "../models/Enrollment.model.js";
import Attempt from "../models/Attempt.model.js";
import User from "../models/User.model.js";

export async function getPeriodSummary(req: Request, res: Response) {
  const { period } = req;
  if (!period) {
    return res.status(500).json({ message: "Period not loaded" });
  }

  const studentsCount = await Enrollment.count({ where: { id: period.id } });

  const agg = await Attempt.findOne({
    where: { id: period.id },
    attributes: [
      [fn("COUNT", col("id")), "startedCount"],
      [
        fn("SUM", literal(`CASE WHEN status = 'finished' THEN 1 ELSE 0 END`)),
        "finishedCount",
      ],
    ],
    raw: true,
  });

  const startedCount = Number((agg as any)?.startedCount ?? 0);
  const finishedCount = Number((agg as any)?.finishedCount ?? 0);

  const notStartedCount = Math.max(studentsCount - startedCount, 0);
  const completionPct =
    studentsCount === 0 ? 0 : Math.round((finishedCount / studentsCount) * 100);

  return res.json({
    ok: true,
    period: {
      id: period.id,
      name: period.name,
      status: period.status,
      startAt: period.startAt,
      endAt: period.endAt,
      testId: period.testId,
      createdAt: period.createdAt,
    },
    counts: {
      studentsCount,
      startedCount,
      finishedCount,
      notStartedCount,
      completionPct,
    },
  });
}

const STUDENT_STATUSES = ["not_started", "in_progress", "finished"] as const;
type StudentStatus = (typeof STUDENT_STATUSES)[number];

function normalizeStatus(attempt: Attempt | undefined) {
  if (!attempt) return "not_started";
  if (attempt.status === "finished") return "finished";
  return "in_progress";
}

export async function getPeriodStudents(req: Request, res: Response) {
  const period = req.period!;
  if (!period)
    return res.status(404).json({ ok: false, error: "Period not found" });

  const periodId = period.id;

  const q = String(req.query.q ?? "").trim();
  const course = String(req.query.course ?? "").trim();
  const status = String(req.query.status ?? "").trim() as StudentStatus | "";

  const page = Math.max(Number(req.query.page ?? 1), 1);
  const pageSizeRaw = Number(req.query.pageSize ?? 25);
  const pageSize = Math.min(Math.max(pageSizeRaw, 1), 200);
  const offset = (page - 1) * pageSize;

  // filtro sobre estudiante
  const userWhere: any = {};
  if (q) {
    userWhere[Op.or] = [
      { rut: { [Op.iLike]: `%${q}%` } },
      { name: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
    ];
  }

  // ⚠️ tu meta en DB es jsonb (por tu SQL). En modelo lo tienes JSON.
  // Ideal: cambia a DataType.JSONB. Mientras tanto, en Postgres Op.contains igual sirve.
  const enrollmentWhere: any = { periodId };
  if (course) {
    enrollmentWhere.meta = { [Op.contains]: { course } };
  }

  // Traemos enrollments + student
  // Después traemos attempts SOLO de esa página (como ya haces),
  // PERO: si hay statusFilter, debemos traer IDs que matcheen status ANTES de paginar.
  //
  // Para eso: calculamos status con subquery en SQL y filtramos con literal.
  const statusLiteral = Sequelize.literal(`
    CASE
      WHEN EXISTS (
        SELECT 1 FROM attempts a
        WHERE a.period_id = enrollments.period_id
          AND a.user_id = enrollments.student_user_id
          AND a.status = 'finished'
      ) THEN 'finished'
      WHEN EXISTS (
        SELECT 1 FROM attempts a
        WHERE a.period_id = enrollments.period_id
          AND a.user_id = enrollments.student_user_id
      ) THEN 'in_progress'
      ELSE 'not_started'
    END
  `);

  const whereWithStatus =
    status && STUDENT_STATUSES.includes(status)
      ? { ...enrollmentWhere, [Op.and]: Sequelize.where(statusLiteral, status) }
      : enrollmentWhere;

  const { rows: enrollments, count: total } = await Enrollment.findAndCountAll({
    where: whereWithStatus,
    include: [
      {
        model: User,
        as: "student",
        required: true,
        attributes: ["id", "rut", "name", "email"],
        where: userWhere,
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset,
  });

  const studentUserIds = enrollments.map((e) => e.studentUserId);

  const attempts = studentUserIds.length
    ? await Attempt.findAll({
        where: { periodId, userId: { [Op.in]: studentUserIds } },
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

  const attemptByUserId = new Map<number, any>();
  for (const a of attempts as any[]) attemptByUserId.set(a.userId, a);

  const rows = enrollments.map((e: any) => {
    const u = e.student;
    const a = attemptByUserId.get(e.studentUserId) ?? null;

    return {
      enrollmentId: e.id,
      student: {
        id: u.id,
        rut: u.rut,
        name: u.name,
        email: u.email,
      },
      status: normalizeStatus(a),
      attempt: a
        ? {
            id: a.id,
            status: a.status,
            answeredCount: a.answeredCount,
            finishedAt: a.finishedAt,
            createdAt: a.createdAt,
          }
        : null,
    };
  });

  // Cursos: si quieres dropdown estable, lo ideal es traerlos aparte (endpoint /courses)
  // Por ahora, para no sumar más queries, dejamos como venía (solo página actual):
  const coursesSet = new Set<string>();
  for (const e of enrollments as any[]) {
    const meta = e.meta as any;
    if (meta?.course) coursesSet.add(meta.course);
  }

  return res.json({
    ok: true,
    period: {
      id: period.id,
      name: period.name,
      status: period.status,
      testId: period.testId,
    },
    page,
    pageSize,
    total, // ✅ ahora total respeta statusFilter
    courses: Array.from(coursesSet).sort(),
    rows,
  });
}
