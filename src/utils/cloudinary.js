import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
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

        console.log("CLoudinary Result:", result);

        return result;
    } catch (error) {
        fs.unlinkSync(filePath);
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
}