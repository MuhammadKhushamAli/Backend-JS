import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler.js";
import { Comment } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse.js";


export const getVideoComments = promiseAsyncHandler(async (req, res) => {
    const { videoId } = req?.params;
    const { page = 1, limit = 10 } = req?.query;
    videoId = videoId?.trim();
    page = int(page);
    limit = int(limit);
    if (!videoId) throw new ApiError(400, "Video ID Required");
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID");
    if (page <= 0) page = 1;
    if (limit <= 0) limit = 10;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video Not Found");

    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
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
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                owner: 1
            }
        }
    ]);
    if (!commentsAggregate) throw new ApiError(500, "Unable to Make Video Aggregate");

    const options = {
        page,
        limit
    };
    const comments = await Comment.aggregatePaginate(commentsAggregate, options);
    if (!comments) throw new ApiError(500, "Pagination Failed");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "Comments Successfully Fetched",
                comments
            )
        );
});

export const addComment = promiseAsyncHandler(async (req, res) => {
    const { videoId } = req?.params;
    const { content } = req?.body;
    videoId = videoId?.trim();
    content = content?.trim();

    if (!videoId) throw new ApiError(400, "Video ID Required");
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID");
    if (!content) throw new ApiError(400, "Content Required");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video Not Found");

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req?.user?._id
    });
    if (!comment) throw new ApiError(500, "Unable to Create Comment");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "Comment Successfully Created",
                comment
            )
        );
});

export const updateComment = promiseAsyncHandler(async (req, res) => {
    const { commentId } = req?.params;
    const { content } = req?.body;

    commentId = commentId?.trim();
    content = content?.trim();

    if (!commentId) throw new ApiError(400, "Comment ID Required");
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid Comment ID");
    if (!content) throw new ApiError(400, "Content is Required");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment Not Found");

    if (!(comment.owner).equals(req?.user?._id)) throw new ApiError(401, "Your are Unauthorized to Update this Comment");

    let message = "Comment Successfully Updated";
    let newComment = undefined;
    if (comment?.content !== content) {
        newComment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set: { content: content }
            },
            {
                new: true
            }
        );
        if (!newComment) throw new ApiError(500, "Unable to Update Comment");
    }
    else {
        message = "Comment Already Up-to-date";
        newComment = comment;
    }

    res.status(200)
        .json(
            new ApiResponse(
                200,
                message,
                comment
            )
        );
});

export const deleteComment = promiseAsyncHandler(async (req, res) => {
    const { commentId } = req?.params;

    commentId = commentId?.trim();

    if (!commentId) throw new ApiError(400, "Comment ID Required");
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Comment ID is Invalid");

    const comment = await Comment.findOneAndDelete(
        {
            _id: commentId,
            owner: req?.user?._id
        }
    );
    if (!comment) throw new ApiError(500, "Unable to Delete Comment");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "Comment Successfully Deleted",
            )
        );
});