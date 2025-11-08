import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler.js";
import { Video } from "../models/video.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { deleteImageCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";

export const getAllVideos = promiseAsyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userName } = req?.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    query = query?.trim() || "";

    if (query?.length > 100) throw new ApiError(400, "Query is too long");
    if (!userName) throw new ApiError(400, "UserName Must be Required");
    if (page < 0) throw new ApiError(400, "Page must be greater than or equal to 0");
    if (limit < 1) throw new ApiError(400, "Limit must be greater than 0");

    const user = await User.findOne({
        userName: userName.trim()
    });
    if (!user) throw new ApiError(404, "User not found");

    
    const videoAggregate = Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user?._id),
                title: {
                    $regex: query?.trim(),
                    $options: "i"
                },
                isPublished: true
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
                videoAggregate[0]
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
                    },
                    {
                        $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1,
                            subscribers: 1,
                            isSubscribed: 1
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

    await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $push: { watchHistory: videoId }
        }
    );

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

export const publishVideo = promiseAsyncHandler(async (req, res) => {
    const { title, description } = req?.body;

    if (
        [title, description].some(field => !field || field?.trim() === "")
    ) {
        throw new ApiError(400, "Title and Description are required to publish the video");
    }

    const videoLocalPath = req?.files?.video?.[0]?.path;
    if (!videoLocalPath) throw new ApiError(400, "Video file is required");

    const thumbnailLocalPath = req?.files?.thumbnail?.[0]?.path;
    if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail file is required");

    const videoCloudinary = await uploadToCloudinary(videoLocalPath);
    if (!videoCloudinary) throw new ApiError(500, "Failed to upload video to cloud");
    const thumbnailCloudinary = await uploadToCloudinary(thumbnailLocalPath);
    if (!thumbnailCloudinary) throw new ApiError(500, "Failed to upload thumbnail to cloud");

    const video = await Video.create({
        title,
        description,
        videoFile: videoCloudinary?.url,
        thumbnail: thumbnailCloudinary?.url,
        duration: videoCloudinary?.duration,
        owner: req?.user?._id
    });
    if (!video) throw new ApiError(500, "Problem in Uploading Video");

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Video Successfully Uploaded",
                video
            )
        );
});

export const updateVideo = promiseAsyncHandler(async (req, res) => {
    const { videoId } = req?.params;

    if (videoId) throw new ApiError(400, "Video Id Required");
    if (isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id");

    const { title, description } = req?.body;

    const thumbnailLocalPath = req?.file?.path;

    if (title || description || thumbnailLocalPath) throw new ApiError(400, "Any one thing from title description or thumbnail must required");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "No Video Found against this ID");

    if (!(video.owner.equals(req?.user._id))) throw new ApiError(401, "You are Unauthorize to Edit this Video");

    let thumbnail = undefined;
    if (thumbnailLocalPath) {
        await deleteImageCloudinary(video?.thumbnail);
        thumbnail = await uploadToCloudinary(thumbnailLocalPath);
    }

    let updatedVideo = undefined;
    if (title || description) {
        title = title?.trim();
        description = description?.trim();
        updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                ...(title && { title }),
                ...(description && { description }),
            },
            {
                new: true
            }
        )
    }

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "The Video is Successfully Updated",
                updateVideo
            )
        )

});

export const deleteVideo = promiseAsyncHandler(async (req, res) => {
    const { videoId } = req?.params;
    videoId = videoId?.trim();
    if (!videoId) throw new ApiError(400, "Video Id not Found");
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id");

    const deletedVideo = await Video.findOneAndDelete(
        {
            $and: [
                { _id: videoId },
                { owner: req?.user?._id }
            ]
        }
    );

    if (!deletedVideo) throw new ApiError(500, "Unable to Delete Video");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "Video is Successfully Deleted"
            )
        );
});

export const togglePublishStatus = promiseAsyncHandler(async (req, res) => {
    const { videoId } = req?.params;

    videoId = videoId?.trim();
    if (!videoId) throw new ApiError(400, "Video Id not Found");
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id");

    const video = await findOneAndUpdate(
        {
            $and: [
                { _id: videoId },
                { owner: req?.user?._id }
            ]
        },
        {
            $set: {
                isPublished: !isPublished
            }
        },
        {
            new: true
        }
    );
    if (!video) throw new ApiError(500, "Unable to Update Video");

    res.status(200)
        .json(
            200,
            "Video Successfully Toggled",
            video
        );
});
