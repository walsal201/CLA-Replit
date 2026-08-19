import { Router, type IRouter } from "express";
import healthRouter from "./health";
import casesRouter from "./cases";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(casesRouter);
router.use(aiRouter);

export default router;
