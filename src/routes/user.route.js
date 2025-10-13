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
    getCurrentUser
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
router.route("/change-Password").post(verifyJWT, changePassword);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/update-details").post(verifyJWT, updateAccountDetails);
router.route("/update-avatar").post(
    verifyJWT,
    upload.single("avatar"),
    updateAvatar
);
router.route("/update-cover-image").post(
    verifyJWT,
    upload.single("coverImage"),
    updateCoverImage
);

export default router;