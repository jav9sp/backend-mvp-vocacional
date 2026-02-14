import { Request, Response, NextFunction } from "express";
import Test from "../../models/Test.model.js";
import { adminGetPeriodResultsData } from "../../services/adminGetPeriodResultsData.service.js";
import { generateInapvPeriodPdfBuffer } from "../../services/generateInapvPeriodPdfBuffer.service.js";
import { generateCaasPeriodPdfBuffer } from "../../services/generateCaasPeriodPdfBuffer.service.js";
import { safeFileName } from "../../utils/safeFileName.js";
import { getLogoDataUri } from "../../utils/getLogoDataUri.js";

function normalizeTestKey(value?: string | null) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase();
  if (key === "caas") return "caas";
  return "inapv";
}

async function resolvePeriodTest(period: any) {
  if (period?.test) return period.test;
  if (!period?.testId) return null;

  return Test.findByPk(period.testId, {
    attributes: ["id", "key", "name", "version"],
  });
}

export async function adminGetPeriodResults(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const period = (req as any).period;
    if (!period) {
      return res.status(404).json({ ok: false, error: "Period not found" });
    }

    const { organizationId } = req.auth!;
    if (period.organizationId !== organizationId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const periodId = period.id;
    const test = await resolvePeriodTest(period);
    const testKey = normalizeTestKey(test?.key);

    const data = await adminGetPeriodResultsData({
      periodId,
      testKey,
      q: String(req.query.q ?? "").trim(),
      page: Math.max(Number(req.query.page ?? 1), 1),
      pageSize: Math.min(Math.max(Number(req.query.pageSize ?? 25), 1), 200),
    });

    return res.json({
      ok: true,
      resultType: data.resultType,
      period: {
        id: period.id,
        name: period.name,
        status: period.status,
        testId: period.testId,
      },
      test: test
        ? {
            id: test.id,
            key: test.key,
            name: test.name,
            version: test.version,
          }
        : null,
      ...data,
    });
  } catch (error) {
    return next(error);
  }
}

export async function adminGetPeriodResultsPdf(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const period = (req as any).period;
    if (!period) {
      return res.status(500).json({ ok: false, error: "Period not loaded" });
    }

    const { organizationId } = req.auth!;
    if (period.organizationId !== organizationId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const periodId = period.id;
    const test = await resolvePeriodTest(period);
    const testKey = normalizeTestKey(test?.key);

    const data = await adminGetPeriodResultsData({
      periodId,
      testKey,
      q: "",
      page: 1,
      pageSize: 2000,
    });

    const periodPayload = {
      id: period.id,
      name: period.name,
      status: period.status,
      testId: period.testId,
    };

    const logoDataUri = await getLogoDataUri();

    const generatedAt = new Date();
    const pdf =
      data.resultType === "caas"
        ? await generateCaasPeriodPdfBuffer({
            period: periodPayload,
            data,
            generatedAt,
            logoDataUri: null,
          })
        : await generateInapvPeriodPdfBuffer({
            period: periodPayload,
            data,
            generatedAt,
            logoDataUri,
          });

    const filename = `reporte-periodo-${safeFileName(period.name ?? `periodo-${periodId}`)}-${data.resultType}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", String(pdf.length));
    return res.status(200).send(pdf);
  } catch (err) {
    return next(err);
  }
}
