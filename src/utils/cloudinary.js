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
        if (!filePath) return null;

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

export const deleteImageCloudinary = async (localURL) => {

    try {
        if (!localURL) return false;

        const splitedArray = localURL.split("/");
        const startIndex = splitedArray.indexOf("upload");

        if (startIndex === -1) return false;

        let public_key_img = splitedArray.slice(startIndex + 2);

        public_key_img = public_key_img.join("/");
        public_key_img = public_key_img.replace(/\.[a-zA-Z0-9]+$/i, "");
        
        const result = await cloudinary.uploader.destroy(public_key_img);

        if (result.result !== "ok") return false;

        return true;
    } catch (error) {
        console.log(`Cloudinary Deletion Error ${error}`);
        return false;
    }
}