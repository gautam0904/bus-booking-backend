import mongoose from "mongoose";
import { errMSG } from "../Constant/message";


const bookedSeatSchema = new mongoose.Schema({
    seatNumber : {
        type : Number,
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
    seat : {
        type : Number,
        required : [true , errMSG.REQUIRED('Seat number')]
    },
    destination :{
        type : String,
        required : [true , errMSG.REQUIRED('Bus destination')],
    },
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