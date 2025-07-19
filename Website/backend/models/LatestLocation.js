import mongoose from "mongoose";

const latestLocationSchema = new mongoose.Schema({
    trackerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GpsTracker",
        unique: true,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    main: {
        type: Number,
        default: 0,
    },
    battery: {
        type: Number,
        default: 0,
    },
});

export default mongoose.model("LatestLocation", latestLocationSchema);
