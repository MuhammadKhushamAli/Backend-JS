import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getChannelStats,
    getChannelVideo
} from "../controllers/dashboard.controller.js";

const router = Router();

router.route("/get-stats").get(verifyJWT, getChannelStats);
router.route("/get-videos").get(verifyJWT, getChannelVideo);

export default router;