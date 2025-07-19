import mongoose from "mongoose";

const locationHistorySchema = new mongoose.Schema({
    trackerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GpsTracker",
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

locationHistorySchema.index({ trackerId: 1, timestamp: 1 });

export default mongoose.model("LocationHistory", locationHistorySchema);
