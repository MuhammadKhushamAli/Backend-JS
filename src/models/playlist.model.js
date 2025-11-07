import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            trim: true,
            required: true
        },
        video: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            }
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

commentSchema.plugin(mongooseAggregatePaginate)

export const Playlist = mongoose.model("Playlist", playlistSchema);