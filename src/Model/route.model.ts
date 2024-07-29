import mongoose from "mongoose";
import { errMSG } from "../Constant/message";


const routeSchema = new mongoose.Schema({

    routeName: {
        type: String,
        required: [true, errMSG.REQUIRED('Route name')]
    },
    stations: [{
        previousStation: {
            type: mongoose.Types.ObjectId,
            ref : "Station",
            required: [true, errMSG.REQUIRED('Previous station')]
        },
        currentStation: {
            type: mongoose.Types.ObjectId,
            ref : "Station",
            required: [true, errMSG.REQUIRED('Current station')]
        },
        distance: {
            type: Number,
            required: [true, errMSG.REQUIRED('Distance')]
        },
    }]
}, { timestamps: true });


const Route = mongoose.model('Route', routeSchema);

export default Route;