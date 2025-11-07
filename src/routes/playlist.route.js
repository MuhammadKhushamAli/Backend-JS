import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    addVideoToPlayist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/create").post(verifyJWT, createPlaylist);
router.route("/get-user-playlist/:userId").get(verifyJWT, getUserPlaylists);
router.route("/get-by-id/:playlistId").get(verifyJWT, getPlaylistById);
router.route("/add-video/:playlistId/:videoId").patch(verifyJWT, addVideoToPlayist);
router.route("/remove-video/:playlistId/:videoId").patch(verifyJWT, removeVideoFromPlaylist);
router.route("/delete/:playlistId").delete(verifyJWT, deletePlaylist);
router.route("/update/:playlistId").patch(verifyJWT, updatePlaylist);

export default router;

