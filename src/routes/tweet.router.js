import { Router } from "express";
import {
    createTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Secure Route
router.route("/tweet").post(verifyJWT, createTweet);
router.route("/getTweets").get()

export default router;