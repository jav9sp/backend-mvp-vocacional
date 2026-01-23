import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import Enrollment from "../../models/Enrollment.model.js";
import Attempt from "../../models/Attempt.model.js";
import InapResult from "../../models/InapResult.model.js";
import User from "../../models/User.model.js";
import Test from "../../models/Test.model.js";

type AreaAgg = {
  area: string;
  interesSum: number;
  aptitudSum: number;
  totalSum: number;
  interesAvg: number;
  aptitudAvg: number;
  totalAvg: number;
};

function safeNum(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export async function adminGetPeriodResults(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const period = req.period!;
    const periodId = period.id;

    // opcional: búsqueda/paginación si decides mostrar tabla por estudiante
    const q = String(req.query.q ?? "").trim();
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSizeRaw = Number(req.query.pageSize ?? 25);
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 200);
    const offset = (page - 1) * pageSize;

    const userWhere: any = {};
    if (q) {
      userWhere[Op.or] = [
        { rut: { [Op.like]: `%${q}%` } },
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }

    // 1) COUNTS (no depende de resultados)
    const studentsCount = await Enrollment.count({ where: { periodId } });

    const finishedCount = await Attempt.count({
      where: { periodId, status: "finished" },
    });

    const inProgressCount = await Attempt.count({
      where: { periodId, status: "in_progress" },
    });

    const notStartedCount = Math.max(
      studentsCount - finishedCount - inProgressCount,
      0,
    );

    // 2) Traer TODOS los resultados disponibles del periodo (para agregación)
    // Esto NO requiere paginación, porque lo usas para calcular agregados.
    // Si en el futuro tienes miles, lo optimizamos con SQL agregado o batch.
    const resultsAll = await InapResult.findAll({
      attributes: [
        "id",
        "scoresByArea",
        "scoresByAreaDim",
        "topAreas",
        "createdAt",
      ],
      include: [
        {
          model: Attempt,
          as: "attempt",
          required: true,
          attributes: [
            "id",
            "status",
            "answeredCount",
            "finishedAt",
            "userId",
            "testId",
            "periodId",
          ],
          where: { periodId, status: "finished" },
          include: [
            {
              model: User,
              as: "user",
              required: true,
              attributes: ["id", "rut", "name", "email"],
            },
            {
              model: Test,
              as: "test",
              required: false,
              attributes: ["id", "name", "version", "key"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // 3) Agregación por área (acumulado y promedio)
    const aggMap = new Map<
      string,
      { interes: number; aptitud: number; total: number }
    >();

    for (const r of resultsAll as any[]) {
      const byDim = (r.scoresByAreaDim ?? {}) as Record<
        string,
        { interes: number; aptitud: number; total: number }
      >;

      for (const [area, v] of Object.entries(byDim)) {
        const prev = aggMap.get(area) ?? { interes: 0, aptitud: 0, total: 0 };
        prev.interes += safeNum(v?.interes);
        prev.aptitud += safeNum(v?.aptitud);
        prev.total += safeNum(v?.total);
        aggMap.set(area, prev);
      }
    }

    const n = Math.max(resultsAll.length, 1); // para evitar división por 0
    const aggregateByArea: AreaAgg[] = Array.from(aggMap.entries())
      .map(([area, v]) => ({
        area,
        interesSum: v.interes,
        aptitudSum: v.aptitud,
        totalSum: v.total,
        interesAvg: Math.round((v.interes / n) * 100) / 100,
        aptitudAvg: Math.round((v.aptitud / n) * 100) / 100,
        totalAvg: Math.round((v.total / n) * 100) / 100,
      }))
      .sort((a, b) => b.totalAvg - a.totalAvg);

    const topAreasPeriod = aggregateByArea.slice(0, 5).map((x) => x.area);

    // 4) (Opcional) filas paginadas por estudiante para tabla
    // Si no quieres tabla, puedes borrar este bloque y listo.
    const totalRows = resultsAll.length; // total real de resultados disponibles
    const pageRows = (resultsAll as any[])
      .slice(offset, offset + pageSize)
      .map((r) => ({
        resultId: r.id,
        createdAt: r.createdAt,
        topAreas: r.topAreas,
        attempt: {
          id: r.attempt.id,
          answeredCount: r.attempt.answeredCount,
          finishedAt: r.attempt.finishedAt,
        },
        student: r.attempt.user
          ? {
              id: r.attempt.user.id,
              rut: r.attempt.user.rut,
              name: r.attempt.user.name,
              email: r.attempt.user.email,
            }
          : null,
        test: r.attempt.test
          ? {
              id: r.attempt.test.id,
              name: r.attempt.test.name,
              version: r.attempt.test.version,
              key: r.attempt.test.key,
            }
          : null,
      }));

    return res.json({
      ok: true,
      period: {
        id: period.id,
        name: period.name,
        status: period.status,
        testId: period.testId,
      },
      counts: {
        studentsCount,
        finishedCount,
        inProgressCount,
        notStartedCount,
      },
      resultsAvailableCount: resultsAll.length, // cuántos resultados existen hoy
      aggregate: {
        topAreas: topAreasPeriod,
        byArea: aggregateByArea, // acumulado + promedio
      },
      // tabla (opcional)
      page,
      pageSize,
      total: totalRows ?? 0,
      rows: pageRows,
    });
  } catch (error) {
    return next(error);
  }
}
