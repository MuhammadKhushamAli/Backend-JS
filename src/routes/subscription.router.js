import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getChannelSubscribers,
    getSubscribedChannels,
    toggleSubscription
} from "../controllers/subscription.controller.js";

const router = Router();


router.route("/toggle-subscription/:channelId").patch(verifyJWT, toggleSubscription);
router.route("/get-subscribers/:channelId").get(verifyJWT, getChannelSubscribers);
router.route("/get-subscribed-channels").get(verifyJWT, getSubscribedChannels);

export default router;