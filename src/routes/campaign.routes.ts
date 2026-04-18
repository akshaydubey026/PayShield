import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as campaignController from "../controllers/campaign.controller.js";

const originRouter = Router();

originRouter.get("/", campaignController.getAll);
originRouter.get("/:id", campaignController.getById);

originRouter.post("/", requireAuth, campaignController.create);
originRouter.patch("/:id", requireAuth, campaignController.update);

export default originRouter;
