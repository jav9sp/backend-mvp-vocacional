import "dotenv";
import "reflect-metadata";

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { connectDB } from "./config/sequelize.js";

import authRoutes from "./routes/auth/auth.routes.js";
import adminRoutes from "./routes/admin/admin.routes.js";
import studentRouter from "./routes/student/student.routes.js";
import superadminRoutes from "./routes/superadmin/superadmin.routes.js";
import offersRouter from "./routes/offers/offers.routes.js";

const app = express();

const frontend = process.env.FRONTEND_URL;

app.use(
  cors({
    origin: frontend ? [frontend] : true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/docs.json", (_req, res) => res.json(swaggerSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Logger ANTES de rutas
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/health/db", async (_req, res) => {
  try {
    await connectDB();
    res.json({ ok: true, db: "connected" });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

// Rutas
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/student", studentRouter);
app.use("/superadmin", superadminRoutes);
app.use("/offers", offersRouter);

// (Opcional) 404 consistente
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

// Error handler AL FINAL
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  return res.status(500).json({ ok: false, error: "Internal server error" });
});

async function bootstrap() {
  await connectDB();

  const port = Number(process.env.API_PORT || 4000);
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
