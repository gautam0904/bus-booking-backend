import mongoose from "mongoose";
import { errMSG } from "../Constant/message";

const stationSchema = new mongoose.Schema({
    station :{
        type : String,
        required : [true , errMSG.REQUIRED('station')],
    },
},{timestamps : true});



const Station = mongoose.model('Station' , stationSchema);

export default Station;