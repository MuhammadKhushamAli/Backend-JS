import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse";
import { Video } from "../models/video.model.js";

export const getChannelStats = promiseAsyncHandler(async (req, res) => {
    const dashboard = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req?.user?._id)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
                pipeline: [
                    {
                        $addFields: {
                            count: {
                                $size: "$channel"
                            }
                        }
                    },
                    {
                        $project: {
                            count: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes",
                            pipeline: [
                                {
                                    $addFields: {
                                        count: {
                                            $size: "$video"
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        count: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            likes: {
                                $first: "$likes"
                            },
                            count: {
                                $size: "$title"
                            },
                            viewsCount: {
                                $sum: "$views"
                            }
                        }
                    },
                    {
                        $project: {
                            likes: 1,
                            count: 1,
                            viewsCount: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "owner",
                as: "comments",
                pipeline: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "comment",
                            as: "commentsLikes",
                            pipeline: [
                                {
                                    $addFields: {
                                        count: {
                                            $size: "$comment"
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        count: 1
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields: {
                            commentsLikes: {
                                $first: "$commentsLikes"
                            }
                        }
                    },
                    {
                        $project: {
                            commentsLikes: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "tweets",
                pipeline: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "tweet",
                            as: "tweetsLikes",
                            pipeline: [
                                {
                                    $addFields: {
                                        count: {
                                            $size: "$tweet"
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        count: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            tweetsLikes: {
                                $first: "$tweetsLikes"
                            }
                        }
                    },
                    {
                        $project: {
                            tweetsLikes: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscribers: {
                    $first: "$subscribers"
                },
                video: {
                    $first: "$video"
                },
                comments: {
                    $first: "$comments"
                },
                tweets: {
                    $first: "$tweets"
                }
            }
        },
        {
            $project: {
                subscribers: 1,
                video: 1,
                comments: 1,
                tweets: 1
            }
        }
    ]);
    if( !dashboard ) throw new ApiError(500, "Unable to Fetch Dashboard");

    res.status(200)
    .json(
        new ApiResponse(
            200,
            "Dashboard Fetched Successfully",
            dashboard[0]
        )
    );
});

export const getChannelVideo = promiseAsyncHandler(async (req, res) => {
    const videos = await Video.find({
        owner: req?.user?._id
    });
    if(!videos) throw new ApiError(404, "No Video Found");

    res.status(200)
    .json(
        new ApiResponse(
            200,
            "Videos Successfully Fetched",
            videos[0]
        )
    );
});