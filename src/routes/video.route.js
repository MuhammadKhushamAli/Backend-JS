import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishVideo,
    togglePublishStatus,
    updateVideo
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/publish-video").post(
    verifyJWT,
    upload.fields([
        {
            name: "video",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishVideo
);

router.route("/get-all-videos").get(verifyJWT, getAllVideos);
router.route("/get-video/:videoId").get(verifyJWT, getVideoById);
router.route("/update/:videoId").patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateVideo

);
router.route("/delete/:videoId").delete(verifyJWT, deleteVideo);
router.route("/toggle-status/:videoId").patch(verifyJWT, togglePublishStatus);
export default router;