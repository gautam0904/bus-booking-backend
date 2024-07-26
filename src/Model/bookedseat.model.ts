import mongoose from "mongoose";
import { errMSG } from "../Constant/message";


const bookedSeatSchema = new mongoose.Schema({
    seatNumber : {
        type : [Number],
        required : [true , errMSG.REQUIRED('Seat number')],
    },
    departure :{
        type : String,
        required : [true , errMSG.REQUIRED('Bus departure')],
    },
    departureTime :{
        type : String,
        required : [true , errMSG.REQUIRED('Bus departure')],
    },
    bookingDate : {
        type : Date,
        required : [true , errMSG.REQUIRED('Booking date')],
    },
    isSingleLady : {
        type : Boolean,
        default : false
    },
    destination :{
        type : String,
        required : [true , errMSG.REQUIRED('Bus destination')],
    },
    mobileNo : {
        type : String,
        required : [true , errMSG.REQUIRED('Mobile number')],
        unique : true,
        match : /^\d{10}$/
    },
    passenger: [{
        name : {
            type : String,
            required : [true , errMSG.REQUIRED('Seat user name')]
        },
        age : {
            type : Number,
            required : [true , errMSG.REQUIRED('Seat user age')]
        },
        gender : {
            type : String,
            required : [true , errMSG.REQUIRED('Seat user gender')]
        }
    }],
    payment : {
        type : Number,
        required : [true , errMSG.REQUIRED('Bus charge')]
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : [true , errMSG.REQUIRED('User id')]
    },
    busId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Bus',
        required : [true , errMSG.REQUIRED('Bus id')]
    }
},{timestamps : true});


const BookedSeat = mongoose.model('BookedSeat' , bookedSeatSchema);

export default BookedSeat;