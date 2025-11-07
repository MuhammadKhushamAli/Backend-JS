import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
const app = express();


// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({
    limit: "16kb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(express.static("public"));

app.use(cookieParser());


import userRoute from "./routes/user.route.js";
import tweetRoute from "./routes/tweet.route.js";
import videoRoute from "./routes/video.route.js";
import subscriptionRoute from "./routes/subscription.router.js";
import playlistRoute from "./routes/playlist.route.js";

// Router Decleration
app.use("/api/v1/users", userRoute);
app.use("/api/v1/tweets", tweetRoute);
app.use("/api/v1/videos", videoRoute);
app.use("/api/v1/subscriptions", subscriptionRoute);
app.use("/api/v1/playlist", playlistRoute);

export default app;