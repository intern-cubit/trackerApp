

// config/db.js
import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB Connected");
        return true;
    } catch (error) {
        console.error("⚠️  MongoDB connection error:", error.message);
        console.log("📝 Server will start without database. Features requiring database will not work.");
        console.log("💡 To fix: Install and start MongoDB, or update MONGODB_URI in .env");
        return false;
    }
};

export default connectDB;
