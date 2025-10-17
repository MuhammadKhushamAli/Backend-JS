import { promiseAsyncHandler } from '../utils/promiseAsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Tweet } from '../models/tweet.model.js';
import { User } from '../models/user.model.js';

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

    const tweets = await Tweet.find({ owner: user?._id }).sort({ createdAt: -1 }).lean();

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