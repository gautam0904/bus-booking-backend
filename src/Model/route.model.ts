import mongoose from "mongoose";


const routeSchema = new mongoose.Schema({

    routeName: {
        type: String,
        required: [true, 'Route name is required']
    },
    stations: [{
        station: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Station',
            required: [true, 'Station reference is required']
        },
        order: {
            type: Number,
            required: [true, 'Order is required']
        },
        distanceFromStart: {
            type: Number,
            required: [true, 'Distance from start is required']
        }
    }]
}, { timestamps: true });


const Route = mongoose.model('Route', routeSchema);

export default Route;