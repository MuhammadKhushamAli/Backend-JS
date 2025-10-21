import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler";
import { Video } from "../models/video.models";
import mongoose from "mongoose";
import { User } from "../models/user.models";

export const getAllVideos = promiseAsyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userName } = req?.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    if (query?.length > 100) throw new ApiError(400, "Query is too long");
    if (!userName) throw new ApiError(400, "UserName Must be Required");
    if (page < 0) throw new ApiError(400, "Page must be greater than or equal to 0");
    if (limit < 1) throw new ApiError(400, "Limit must be greater than 0");

    const user = await User.findOne({
        userName: userName.trim()
    });
    if (!user) throw new ApiError(404, "User not found");

    const actorUser = req?.user;
    if (!actorUser) throw new ApiError(401, "Unauthorized Access");

    let isOnlyPublicVideos = true;
    if (actorUser?._id.equals(user?._id)) {
        isOnlyPublicVideos = false;
    }

    const videoAggregate = Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user?._id),
                title: {
                    $regex: query?.trim() || "",
                    $options: "i"
                },
                ...(isOnlyPublicVideos && { isPublished: true })
            },
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
                            fullName: 1,
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                [sortBy || "createdAt"]: sortType === "desc" ? -1 : 1
            }
        }
    ]);
    if (!videoAggregate) throw new ApiError(500, "Aggregation failed");

    const options = {
        page,
        limit
    };

    const paginatedVideos = await Video.aggregatePaginate(videoAggregate, options);
    if (!paginatedVideos) throw new ApiError(500, "Unable to fetch videos");

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Videos fetched successfully",
                paginatedVideos
            )
        )
});

export const getVideoById = promiseAsyncHandler(async (req, res) => {
    const { videoId } = req?.params;

    if (!videoId) throw new ApiError(400, "Video ID is required");
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID");

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers",
                        }
                    },
                    {
                        $addFields: {
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req?.user?._id, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            },
                            subscribers: {
                                $size: "$subscribers"
                            },
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                owner: 1,
                title: 1,
                description: 1,
                videoFile: 1,
                views: 1
            }
        }
    ]);

    if (!(video.length)) throw new ApiError(404, "Video not found");

    req?.user?.watchHistory?.push(videoId);
    await req?.user?.save();
    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 }
        }
    )

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Video fetched successfully",
                video[0]
            )
        )
});