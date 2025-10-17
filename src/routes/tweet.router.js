import { Router } from "express";
import {
    createTweet,
    getUserTweets,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Secure Route
router.route("/tweet").post(verifyJWT, createTweet);
router.route("/get-tweets/:userName").get(verifyJWT, getUserTweets);

export default router;