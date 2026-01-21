import { Request, Response } from "express";
import { buildPeriodReport } from "../../services/period-report.service.js";

export async function adminGetPeriodReport(req: Request, res: Response) {
  const { period } = req;
  if (!period) {
    return res.status(500).json({ ok: false, error: "Period not loaded" });
  }

  try {
    const report = await buildPeriodReport(period.id);
    return res.json({ ok: true, ...report });
  } catch (e: any) {
    if (e.message === "Period not found")
      return res.status(404).json({ ok: false, error: e.message });
    return res.status(500).json({ ok: false, error: "Report failed" });
  }
}
