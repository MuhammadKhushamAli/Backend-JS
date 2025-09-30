import mongoose from "mongoose";
import { dbName } from "../constants.js";


export default async function connectDB(){
    try {
        const connection = await mongoose.connect(`${process.env.MONGODBURL}/${dbName}`);
        console.log(`Database connected successfully: connection: ${connection}`);
    } catch (error) {
        console.error("Error in connecting to database", error);
        process.exit(1);
    }
}