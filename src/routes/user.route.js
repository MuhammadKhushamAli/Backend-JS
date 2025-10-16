import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccesstoken,
    changePassword,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccesstoken);
router.route("/change-Password").patch(verifyJWT, changePassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-details").patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateAvatar
);
router.route("/update-cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateCoverImage
);

router.route("/channel/:userName").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;