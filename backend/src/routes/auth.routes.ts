import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", (req, res) => void authController.register(req, res));
router.post("/login", (req, res) => void authController.login(req, res));
router.post("/refresh", (req, res) => void authController.refresh(req, res));
router.post("/logout", requireAuth, (req, res) => void authController.logout(req, res));
router.post("/logout-all", requireAuth, (req, res) => void authController.logoutAll(req, res));
router.get("/me", requireAuth, (req, res) => void authController.me(req, res));
router.patch("/profile", requireAuth, (req, res) => void authController.updateProfile(req, res));
router.patch("/change-password", requireAuth, (req, res) => void authController.changePassword(req, res));

export default router;
