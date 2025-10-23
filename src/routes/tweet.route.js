import { Router } from "express";
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Secure Route
router.route("/tweet").post(verifyJWT, createTweet);
router.route("/get-tweets/:userName").get(verifyJWT, getUserTweets);
router.route("/update-tweet").patch(verifyJWT, updateTweet);
router.route("/delete-tweet").delete(verifyJWT, deleteTweet);

export default router;