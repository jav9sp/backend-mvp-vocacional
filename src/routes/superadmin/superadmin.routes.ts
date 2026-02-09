import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../middlewares/auth.middleware.js";
import { superadminGetDashboard } from "../../controllers/superadmin/superadmin.dashboard.controller.js";
import {
  superadminListOrganizations,
  superadminGetOrganization,
  superadminCreateOrganization,
  superadminUpdateOrganization,
  superadminDeleteOrganization,
} from "../../controllers/superadmin/superadmin.organizations.controller.js";
import {
  superadminListAdmins,
  superadminGetAdmin,
  superadminCreateAdmin,
  superadminUpdateAdmin,
  superadminResetAdminPassword,
} from "../../controllers/superadmin/superadmin.admins.controller.js";

const router = Router();

// Middleware global: todas las rutas requieren rol superadmin
router.use(requireAuth, requireRole("superadmin"));

// Dashboard
router.get("/dashboard", superadminGetDashboard);

// Organizations
router.get("/organizations", superadminListOrganizations);
router.get("/organizations/:id", superadminGetOrganization);
router.post("/organizations", superadminCreateOrganization);
router.patch("/organizations/:id", superadminUpdateOrganization);
router.delete("/organizations/:id", superadminDeleteOrganization);

// Admins
router.get("/admins", superadminListAdmins);
router.get("/admins/:id", superadminGetAdmin);
router.post("/admins", superadminCreateAdmin);
router.patch("/admins/:id", superadminUpdateAdmin);
router.post("/admins/:id/reset-password", superadminResetAdminPassword);

export default router;
