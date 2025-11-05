import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";

export const toggleSubscription = promiseAsyncHandler(async (req, res) => {
    const { channelId } = req?.params;
    channelId = channelId?.trim();
    if (!channelId) throw new ApiError(400, "Channel Id not Found");
    if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid Channel Id");

    const channel = await User.findById(channelId);
    if (!channel) throw new ApiError(404, "Channel not Found");

    const subscription = await Subscription.create({
        subscriber: req?.user?._id,
        channel: channel?._id
    });
    if( !subscription ) throw new ApiError(500, "Unable to Subscribe");

    res.status(200)
    .json(
        new ApiResponse(
            200,
            "Channel Successfully Subscribed"
        )
    )
});

export const getChannelSubscribers = promiseAsyncHandler(async (req, res) => {
    const { channelId } = req?.params;
    channelId = channelId?.trim();
    if( !channelId ) throw new ApiError(400, "Channel Id not Found");
    if( !isValidObjectId(channelId) ) throw new ApiError(400, "Invalid Channel Id");

    const channel = await User.findById(channelId);
    if( !channel ) throw new ApiError(404, "Channel not Found");

    if( !(channel?._id.equals(req?.user?._id)) ) throw new ApiError(500, "You are Unauthorize to get Channel Subscribers List"); 

    const subscribers = Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "User",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
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
            $project: {
                $subscribers: 1
            }
        }
    ]);

    if( !subscribers ) throw new ApiError(500, "Unable to Fetch Subscribers");

    res.status(200)
    .json(
        200,
        "Subscribers Fetched Successfully",
        subscribers
    );
});
