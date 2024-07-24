import mongoose from "mongoose";
import { errMSG } from "../Constant/message";


const busSchema = new mongoose.Schema({
    busNumber : {
        type : String,
        required : [true , errMSG.REQUIRED('Bus number')],
    },
    departure :{
        type : String,
        required : [true , errMSG.REQUIRED('Bus departure')],
    },
    departureTime :{
        type : String,
        required : [true , errMSG.REQUIRED('Bus departure')],
    },
    destination :{
        type : String,
        required : [true , errMSG.REQUIRED('Bus destination')],
    },
    TotalSeat : {
        type : Number,
        default : 50
    },
    charge : {
        type : Number,
        required : [true , errMSG.REQUIRED('Bus charge')]
    },
    buscancel : {
        type : Date,
        default : null,
    },
    route : [{
        previousStation :{
            type : String,
            required : [true , errMSG.REQUIRED('Previous station')]
        },
        currentStation :{
            type : String,
            required : [true , errMSG.REQUIRED('Current station')]
        },
        distance :{
            type : Number,
            required : [true , errMSG.REQUIRED('Distance')]
        }
    }]
},{timestamps : true});


const Bus = mongoose.model('Bus' , busSchema);

export default Bus;