import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
    uploadToCloudinary,
    deleteImageCloudinary
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler.js";
import jwt from "jsonwebtoken"

async function generateAccesAndRefreshTokens(userOrID) {
    try {

        const user = userOrID._id ? userOrID : await User.findById(userOrID);

        const refreshToken = await user.generateRefreshToken();
        const accessToken = await user.generateAccessToken();

        if (!refreshToken || !accessToken) {
            throw new ApiError(500, "DataBase donot Generate Tokens");
        }

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { refreshToken, accessToken };

    } catch (error) {
        throw new ApiError(500, "Error in Generating Tokens");
    }
}

export const registerUser = promiseAsyncHandler(async (req, res) => {

    // Get data from front end
    // Validate
    // Check if user already exists
    // Check for images, Check for Avatar
    // Upload to cloudinary
    // Ceate use object, enter in db
    // remove password and refresh token
    // check for user creation
    // return response

    try {
        const { userName, email, fullName, password } = req.body;


        if (
            [userName, email, fullName, password].some(input => !input || input?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required");
        }

        const existingUser = await User.findOne({
            $or: [{ userName }, { email }]
        })

        if (existingUser) throw new ApiError(409, "User already exists");

        const avatarLocalUrl = req.files?.avatar?.[0]?.path;
        const coverImageLocalUrl = req.files?.coverImage?.[0]?.path;

        if (!avatarLocalUrl) throw new ApiError(400, "Avatar is required");

        const avatarUrl = await uploadToCloudinary(avatarLocalUrl);
        const coverImageUrl = await uploadToCloudinary(coverImageLocalUrl);

        if (!avatarUrl) throw new ApiError(500, "Could not upload avatar");

        const user = await User.create({
            userName: userName.toLowerCase(),
            email,
            fullName,
            avatar: avatarUrl,
            coverImage: coverImageUrl || "",
            password
        })

        const enteredUser = await User.findById(user._id).select("-password -refreshToken");

        if (!enteredUser) throw new ApiError(500, "Could not create user");

        return res.status(201).json(
            new ApiResponse(201, "User created successfully", enteredUser)
        );
    } catch (error) {
        throw new ApiError(500, `Error in Registering User: ${error}`);
    }
});

export const loginUser = promiseAsyncHandler(async (req, res) => {
    // Get data from front end
    // Validate (username or email)
    // Check if user exists
    // Check for password match
    // Generate access token and refresh token
    // Send Cookie
    try {
        const { userName, email, password } = req.body;

        if (!userName && !email) {
            throw new ApiError(400, "All fields are required");
        }

        const user = await User.findOne({
            $or: [{ userName }, { email }]
        });

        if (!user) throw new ApiError(404, "User Not Found");

        if (
            !(await user.isPasswordCorrect(password))
        ) {
            throw new ApiError(401, "Incorrect Password");
        }

        const { refreshToken, accessToken } = await generateAccesAndRefreshTokens(user);

        const loggedInUser = await User.findOne(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("refreshToken", refreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(
                    200,
                    "Successfully LoggedIn",
                    {
                        user: loggedInUser,
                        refreshToken,
                        accessToken
                    }
                )
            );
    } catch (error) {
        throw new ApiError(500, `Error in Login: ${error}`);
    }

});

export const logoutUser = promiseAsyncHandler(async (req, res) => {

    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unser: {
                    refreshToken: 1
                }
            },
            {
                new: true
            }
        )
        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200, "Successfully Logged Out")
            );
    } catch (error) {
        throw new ApiError(500, `Error in Logout: ${error}`)
    }
});

export const refreshAccesstoken = promiseAsyncHandler(async (req, res) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!token) throw new ApiError(400, "Token not Found");

        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        if (!decodedToken) throw new ApiError(401, "Invalid Token");

        const user = await User.findById(decodedToken._id);

        if (!user) throw new ApiError(404, "No User Found");

        if (user.refreshToken != token) throw new ApiError(401, "Unauthorized Access");

        const { refreshToken, accessToken } = await generateAccesAndRefreshTokens(user);

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("refreshToken", refreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(200, "Successfully Update Tokens", {
                    refreshToken,
                    accessToken
                })
            );
    } catch (error) {
        throw new ApiError(500, `Error in Refreshing Tokens: ${error}`)
    }
});

export const changePassword = promiseAsyncHandler(async (req, res) => {

    const { oldPassword, changedPassword } = req.body;

    if (
        [oldPassword, changedPassword].some(field => !field || field?.trim() === "")
    ) {
        throw new ApiError(400, "All Fields Are Required");
    }

    const user = req.user;


    if (!user) throw new ApiError(500, "Error in getting User");

    if (
        !(await user.isPasswordCorrect(oldPassword))
    ) {
        throw new ApiError(401, "Incorrect Current Password");
    }

    user.password = changedPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200)
        .json(
            new ApiResponse(200, "Password Successfully Changed")
        )

});

export const getCurrentUser = promiseAsyncHandler(async (req, res) => {
    return res.status(200)
        .json(
            new ApiResponse(200,
                "User Seccessfully Returned",
                req?.user
            )
        )
});

export const updateAccountDetails = promiseAsyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!(fullName && email)) throw new ApiError(400, "All Fields Required");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Full Name and Email is updated",
                user
            )
        );
});

export const updateAvatar = promiseAsyncHandler(async (req, res) => {
    const loclAvatarURL = req?.file?.path;

    if (!loclAvatarURL) throw new ApiError(400, "Avatar Not Found");

    if (
        !(await deleteImageCloudinary(req?.user?.avatar))
    ) throw new ApiError(500, "Unable to Delete Previous Avatar");

    const avatarURL = await uploadToCloudinary(loclAvatarURL);

    if (!avatarURL) throw new ApiError(500, "Unable to Upload Avatar");

    const user = await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set: {
                avatar: avatarURL
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Avatar Updated Successfully",
                user
            )
        )
});

export const updateCoverImage = promiseAsyncHandler(async (req, res) => {
    const localCoverImageURl = req?.file?.path;

    if (!localCoverImageURl) throw new ApiError(400, "Cover Image Not Found");

    if (
        !(await deleteImageCloudinary(req?.user?.coverImage))
    ) throw new ApiError(500, "Unable to Delete Previous Cover Image");


    const coverImage = await uploadToCloudinary(localCoverImageURl);

    if (!coverImage) throw new ApiError(500, "Unable to Upload Cover Image");

    const user = await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set: {
                coverImage
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Successfully Update Cover Image",
                user
            )
        )
});