import { Router } from "express";
import * as statsController from "../controllers/stats.controller.js";

const statsRouter = Router();

statsRouter.get("/donor-summary", statsController.donorSummary);
statsRouter.get("/overview", statsController.overview);

export default statsRouter;
