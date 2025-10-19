import { promiseAsyncHandler } from '../utils/promiseAsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Tweet } from '../models/tweet.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

export const createTweet = promiseAsyncHandler(async (req, res) => {
    const { content } = req?.body;
    if (!(content.trim())) throw new ApiError(400, "Tweet content is required");

    const user = req?.user;
    if (!user) throw new ApiError(500, "Unable to identify user");

    const tweet = await Tweet.create({
        owner: user._id,
        content: content.trim()
    });

    if (!tweet) throw new ApiError(500, "Unable to create tweet");

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Tweet created successfully",
                tweet
            )
        );
});

export const getUserTweets = promiseAsyncHandler(async (req, res) => {
    const { userName } = req?.params;
    if (!userName) throw new ApiError(400, "Username is required");

    const user = await User.findOne(
        {
            userName: userName.trim()
        }
    );
    if (!user) throw new ApiError(404, "User not found");

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user?._id)
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
        }
    ]);

    if (!tweets) throw new ApiError(500, "Unable to fetch tweets");

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Tweets fetched successfully",
                tweets
            )
        );
});

export const updateTweet = promiseAsyncHandler(async (req, res) => {
    const { tweetId, content } = req?.body;

    if (!tweetId) throw new ApiError(400, "Tweet ID not Found");
    if (!mongoose.isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet ID");
    if (!(content.trim())) throw new ApiError(400, "Tweet content is required");

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");

    if (tweet.content === content.trim()) throw new ApiError(400, "No changes detected in tweet content");


    const newTweet = await Tweet.findOneAndUpdate(
        {
            $and: [
                { _id: tweetId },
                { owner: req?.user?._id }
            ]
        },
        {
            $set: { content: content.trim() }
        },
        {
            new: true
        }
    );
    if (!newTweet) throw new ApiError(500, "Unable to update tweet");

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Tweet updated successfully",
                newTweet
            )
        );
});

export const deleteTweet = promiseAsyncHandler(async (req, res) => {
    const { tweetId } = req?.body;
    if (!(tweetId?.trim())) throw new ApiError(400, "Tweet ID not Found");
    if (!(mongoose.isValidObjectId(tweetId))) throw new ApiError(400, "Invalid Tweet ID");


    const isDeleted = await Tweet.findOneAndDelete(
        {
            $and: [
                { _id: tweetId },
                { owner: req?.user?._id }
            ]
        }
    );
    if (!isDeleted) throw new ApiError(500, "Unable to delete tweet");

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Tweet deleted successfully"
            )
        );
});