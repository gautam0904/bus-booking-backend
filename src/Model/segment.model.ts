import mongoose from "mongoose";


const segmentSchema = new mongoose.Schema({
   routeId : {
        type : mongoose.Types.ObjectId,
        ref: 'Route',
        required: [true, 'Route reference is required']
    },
    fromStation: {
        type: String,
        required: [true, 'Route name is required']
    },
    toStation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: [true, 'Station reference is required']
    },
    distance: {
        type: Number,
        required: [true, 'Distance from start is required']
    }

}, { timestamps: true });


const Segment = mongoose.model('Segment', segmentSchema);

export default Segment;