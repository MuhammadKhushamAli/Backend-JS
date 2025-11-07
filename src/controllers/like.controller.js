import { isValidObjectId } from "mongoose";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler.js";

export const toggleVideLike = promiseAsyncHandler(async (req, res) => {
    const { videoId } = req?.params;
     
})