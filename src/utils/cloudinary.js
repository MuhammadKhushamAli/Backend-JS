import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({
    path: "./.env"
});


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (filePath) => {
    try {
        if(!filePath) return null;

        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        })
        
        fs.unlinkSync(filePath);

        return result.url;
    } catch (error) {
        fs.unlinkSync(filePath);
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
}