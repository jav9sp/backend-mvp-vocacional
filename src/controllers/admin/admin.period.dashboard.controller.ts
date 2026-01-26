import { Request, Response } from "express";
import { Op, Sequelize, fn, col, literal } from "sequelize";
import Enrollment from "../../models/Enrollment.model.js";
import User from "../../models/User.model.js";
import Attempt from "../../models/Attempt.model.js";
import InapResult from "../../models/InapResult.model.js";

type StudentStatus = "not_started" | "in_progress" | "finished";
const STUDENT_STATUSES: StudentStatus[] = [
  "not_started",
  "in_progress",
  "finished",
];

function normalizeStatus(attempt: any): StudentStatus {
  if (!attempt) return "not_started";
  if (attempt.status === "finished") return "finished";
  return "in_progress";
}

export async function getPeriodDashboard(req: Request, res: Response) {
  try {
    const period = (req as any).period;
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

    // ----- COUNTS GLOBALES (sin filtros) -----
    const studentsCount = await Enrollment.count({ where: { periodId } });

    const agg = await Attempt.findOne({
      where: { periodId },
      attributes: [
        [fn("COUNT", fn("DISTINCT", col("userId"))), "startedCount"],
        [
          fn(
            "COUNT",
            fn(
              "DISTINCT",
              literal(
                `CASE WHEN status = 'finished' THEN "userId" ELSE NULL END`,
              ),
            ),
          ),
          "finishedCount",
        ],
      ],
      raw: true,
    });

    const startedCount = Number((agg as any)?.startedCount ?? 0);
    const finishedCount = Number((agg as any)?.finishedCount ?? 0);
    const notStartedCount = Math.max(studentsCount - startedCount, 0);
    const completionPct =
      studentsCount === 0
        ? 0
        : Math.round((finishedCount / studentsCount) * 100);

    // ----- FILTROS PARA TABLA -----
    const userWhere: any = {};
    if (q) {
      userWhere[Op.or] = [
        { rut: { [Op.iLike]: `%${q}%` } },
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const enrollmentWhere: any = { periodId };
    if (course) enrollmentWhere.meta = { [Op.contains]: { course } };

    // Status calculado (para filtrar antes de paginar)
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
        ? {
            ...enrollmentWhere,
            [Op.and]: Sequelize.where(statusLiteral, status),
          }
        : enrollmentWhere;

    // ----- ENROLLMENTS + STUDENT (paginado) -----
    const { rows: enrollments, count: total } =
      await Enrollment.findAndCountAll({
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

    // ----- ATTEMPTS DEL PERIODO PARA LOS USERS DE LA PÁGINA + RESULT -----
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
        enrollment: { status: e.status, meta: e.meta, createdAt: e.createdAt },
        student: { id: u.id, rut: u.rut, name: u.name, email: u.email },
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

    // cursos (solo desde página actual; si quieres dropdown global te hago endpoint /courses)
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
        startAt: period.startAt,
        endAt: period.endAt,
        testId: period.testId,
      },
      counts: {
        studentsCount,
        startedCount,
        finishedCount,
        notStartedCount,
        completionPct,
      },
      page,
      pageSize,
      total,
      courses: Array.from(coursesSet).sort(),
      rows,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, error: "Unexpected error", detail: String(err) });
  }
}
