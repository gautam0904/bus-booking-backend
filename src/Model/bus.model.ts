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
    route :{
        type : mongoose.Types.ObjectId,
        ref : 'Route',
        required : [true , errMSG.REQUIRED('Route id')]
    } ,
    stops : [{
        Station :{
            type : mongoose.Types.ObjectId,
            ref : 'Station',
            required : [true , errMSG.REQUIRED('Station id')]
        },
        distance : {
            type : Number,
            required : [true , errMSG.REQUIRED('Distance')]
        }
    }]
},{timestamps : true});


const Bus = mongoose.model('Bus' , busSchema);

export default Bus;