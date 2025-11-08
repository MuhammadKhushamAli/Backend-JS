import mongoose, { isValidObjectId } from "mongoose";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse";
import { Comment } from "../models/comment.model.js";

export const toggleVideoLike = promiseAsyncHandler(async (req, res) => {
    const { videoId } = req?.params;
    videoId = videoId?.trim();
    if (!videoId) throw new ApiError(400, "Video ID Required");
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Video ID is Invalid");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not Found");

    const like = await Like.create({
        video: videoId,
        likedBy: req?.user?._id
    });
    if (!like) throw new ApiError(500, "Unable to Like the Video");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "Video is Liked Successfully",
                like
            )
        );
});

export const toggleCommentLike = promiseAsyncHandler(async (req, res) => {
    const { commentId } = req?.params;
    commentId = commentId?.trim();
    if (!commentId) throw new ApiError(400, "Comment ID Required");
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Comment ID is Invalid");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not Found");

    const like = await Like.create({
        comment: commentId,
        likedBy: req?.user?._id
    });
    if (!like) throw new ApiError(500, "Unable to Like the Comment");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "Comment is Liked Successfully",
                like
            )
        );
});

export const toggleTweetLike = promiseAsyncHandler(async (req, res) => {
    const { tweetId } = req?.params;
    tweetId = tweetId?.trim();
    if (!tweetId) throw new ApiError(400, "Tweet ID Required");
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Tweet ID is Invalid");

    const tweet = await Comment.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not Found");

    const like = await Like.create({
        tweet: tweetId,
        likedBy: req?.user?._id
    });
    if (!like) throw new ApiError(500, "Unable to Like the Tweet");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "Tweet is Liked Successfully",
                like
            )
        );
});

export const getAllLikedVideos = promiseAsyncHandler(async (req, res) => {
    const videos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req?.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        avatar: 1,
                                        userName: 1,
                                        fullName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addField: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    },
                    {
                        $project: {
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            title: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                likedVideos: 1
            }
        }
    ]);
    if (!videos) throw new ApiError(500, "Unable to Fetch Liked Videos");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "Liked Videos Fetched Successfully",
                videos[0]
            )
        )
});