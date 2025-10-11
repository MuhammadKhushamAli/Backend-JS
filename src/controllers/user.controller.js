import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler.js";


async function generateAccesAndRefreshTokens(user) {
    try {

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
});

export const loginUser = promiseAsyncHandler(async (req, res) => {
    // Get data from front end
    // Validate (username or email)
    // Check if user exists
    // Check for password match
    // Generate access token and refresh token
    // Send Cookie
    const { userName, email, password } = req.body;
    console.log(email);
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
        )

});

export const logoutUser = promiseAsyncHandler(async (req, res) => {

    console.log(req)
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
});