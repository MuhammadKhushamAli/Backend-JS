import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler.js";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Video } from "../models/video.model.js";

export const createPlaylist = promiseAsyncHandler(async (req, res) => {
    const { name, description } = req?.body;
    name = name?.trim();
    description = description?.trim();
    if (
        [name, description].some(field => !field || field?.trim() === "")
    ) throw new ApiError(400, "Name and Description both Required");

    const existingPlaylist = await Playlist.findOne(
        {
            $and: [{ name }, { owner: req?.user?._id }]
        }
    );
    if (!existingPlaylist) throw new ApiError(409, "You already have the Same Name of Existing Playlist");

    const playlist = await Playlist.create({
        name,
        description,
        owner: req?.user?._id
    });
    if (!playlist) throw new ApiError(500, "Unable to Create Playlist");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "Playlist Successfully Created",
                playlist
            )
        )
});

export const getUserPlaylists = promiseAsyncHandler(async (req, res) => {
    const { userId } = req?.params;
    userId = userId?.trim();
    if (!userId) throw new ApiError(400, "User Id is Required");
    if (!isValidObjectId(userId)) throw new ApiError(400, "Incorrect User Id");

    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos",
                pipline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipline: [
                                {
                                    $project: {
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1
                                    },
                                }
                            ]
                        }
                    },
                    {
                        $addField: {
                            $owner: "$first"
                        }
                    }
                ]
            }
        }
    ]);

    if (!playlist) throw new ApiError(500, "Unable to Fetch Playlist");

    res.status(200)
        .json(
            new ApiResponse(
                200,
                "Playlist Fetched Successfully",
                playlist
            )
        );
});

export const getPlaylistById = promiseAsyncHandler(async (req, res) => {
    const { playlistId } = req?.params;
    playlistId = playlistId?.trim();
    if (!playlistId) throw new ApiError(400, "Playlist Id is Required");
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid PLaylist Id");

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos",
                pipline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipline: [
                                {
                                    $project: {
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1
                                    },
                                }
                            ]
                        }
                    },
                    {
                        $addField: {
                            $owner: "$first"
                        }
                    }
                ]
            }
        }
    ]);
    if (!playlist) throw new ApiError(500, "Unable to Fetch Playlist");

    res.status(200)
        .json(
            new ApiError(
                200,
                "Playlist Successfully Fetched",
                playlist
            )
        );
});

export const addVideoToPlayist = promiseAsyncHandler(async (req, res) => {
    const { playlistId, videoId } = req?.params;
    if (!(playlistId && videoId)) throw new ApiError(400, "Playlist Id and Video Id both are Reqired");
    if (!(isValidObjectId(playlistId) && isValidObjectId(videoId))) throw new ApiError(400, "Id's must be Correct");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not Found");

    const newPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { video: videoId }
        },
        {
            new: true
        }
    );

    if( !newPlaylist ) throw new ApiError(500, "Unable to Update Playlist");

    res.status(200)
    .json(
        new ApiResponse(
            200,
            "Video Succcessfully Added to Playlist",
            newPlaylist
        )
    );
});

export const removeVideoFromPlaylist = promiseAsyncHandler(async (req, res) => {
    const { playlistId, videoId } = req?.params;
    playlistId = playlistId?.trim();
    videoId = videoId?.trim();
    if( !(playlistId && videoId) ) throw new ApiError(400, "Playlist ID and Video ID both are Required");
    if( !(isValidObjectId(playlistId) && isValidObjectId(videoId)) ) throw new ApiError(400, "Invalid Playlist ID or Video ID");

    const video = await Video.findById(videoId);
    if( !video ) throw new ApiError(404, "Video not Found");

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{video: videoId}
        }
    );
    if( !playlist ) throw new ApiError(500, "Unable to Remove Video From Playlist");

    res.status(200)
    .json(
        new ApiResponse(
            200,
            "Video Successfully Removed",
            playlist
        )
    );
});

export const deletePlaylist = promiseAsyncHandler(async (req, res) => {
    const { playlistId } = req?.params;
    playlistId = playlistId?.trim();
    if( !playlistId ) throw new ApiError(400, "Playlist Id is Required");
    if ( !isValidObjectId(playlistId) ) throw new ApiError(400, "Playlist Id is Invalid");

    const playlist = await Playlist.findByIdAndDelete(playlistId);
    if( !playlist ) throw new ApiError(500, "Unable to Delete Playlist");

    res.status(200)
    .json(
        new ApiResponse(
            200,
            "Playlist Successfully Deleted"
        )
    );
});

export const updatePlaylist = promiseAsyncHandler(async (req, res) => {
    const { playlistId } = req?.params;
    const { name, description } = req?.body;
    playlistId = playlistId?.trim();
    name = name?.trim();
    description = description?.trim();
    if( !playlistId ) throw new ApiError(400, "Playlist ID is Required");
    if( name || description ) throw new ApiError(400, "Name or Description must Required");

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            ...(name && {name}),
            ...(description && {description})
        },
        {
            new: true
        }
    );
    if( !playlist ) throw new ApiError(500, "Unable to Update Playlist");

    res.status(200)
    .json(
        new ApiError(
            200,
            "Playlist Successfully Updated",
            playlist
        )
    )
});