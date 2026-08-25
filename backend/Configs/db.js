import mongoose  from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {console.log("MongoDB connected successfully")})

        const mongodbURI = process.env.MONGODB_URI?.replace(/\/+$/, "");
        const projectName = "Resume_Builder";
        if (!mongodbURI) {
            throw new Error("MONGODB_URI is not defined in the environment variables");
        }
        await mongoose.connect(`${mongodbURI}/${projectName}`)
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

export default connectDB;