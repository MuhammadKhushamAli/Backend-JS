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
import tweetRoute from "./routes/tweet.router.js";

// Router Decleration
app.use("/api/v1/users", userRoute);
app.use("/api/v1/tweets", tweetRoute);

export default app;