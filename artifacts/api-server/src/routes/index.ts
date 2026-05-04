import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkinsRouter from "./checkins";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkinsRouter);

export default router;
