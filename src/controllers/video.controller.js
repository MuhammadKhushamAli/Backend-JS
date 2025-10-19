import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler";

export const getAllVideos = promiseAsyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userName} = req?.query;

    if (!userName) throw new ApiError(400, "UserName Must be Required");
    if(page < 0) throw new ApiError(400, "Page must be greater than or equal to 0");
    if(limit < 1) throw new ApiError(400, "Limit must be greater than 0");

    const user = await User.findOne({
        userName: userName.trim()
    });
    if(!user) throw new ApiError(404, "User not found");

    const actorUser = req?.user;
    if(!actorUser) throw new ApiError(401, "Unauthorized Access");

    const video = await Video.aggregate([
        {
            $match: {
                $and: [
                    {
                        owner: new mongoose.Types.ObjectId(user?._id)
                    },
                    {
                        title: {
                            $and: [
                                {$regex: query?.trim() || ""},
                                {$options: "i"}
                            ]
                        }
                    },
                    {
                        $cond: {
                            if: {$ne: user?._id.equals(actorUser?._id)},
                            then: {isPublished: true}
                        }
                    }
                ]
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
        },
        {
            $sort: {
                sortBy: sortType === "desc" ? -1 : 1
            }
        }
    ]);
    if(!video) throw new ApiError(500, "Unable to fetch videos");

    const options = {
        page,
        limit
    };

    const paginatedVideos = await Video.aggregatePaginate(video, options);
    if(!paginatedVideos) throw new ApiError(500, "Unable to fetch videos");

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            "Videos fetched successfully",
            paginatedVideos
        )
    )
})