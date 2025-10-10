import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { promiseAsyncHandler } from "../utils/promiseAsyncHandler.js";

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

    res.status(201).json(
        new ApiResponse(201, "User created successfully", enteredUser)
    );
})