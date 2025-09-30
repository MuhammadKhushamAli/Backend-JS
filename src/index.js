import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: "./.env"
});

// Connecting to database
connectDB()
.then(
    () => app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on port ${process.env.PORT || 3000}`);
    })
)
.catch((error) => {
    console.error("Error in connecting to database", error);
    process.exit(1);
})