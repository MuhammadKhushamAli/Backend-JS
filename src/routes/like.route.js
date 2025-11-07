import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllLikedVideos,
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike
} from "../controllers/like.controller.js";

const router = Router();

router.route("/like-video/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/like-comment/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/like-tweet/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/get-liked-videos").get(verifyJWT, getAllLikedVideos);

export default router;