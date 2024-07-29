import mongoose from "mongoose";

export interface IBus{
   _id ?: string;
   busNumber : string;
   departure : string;
   departureTime : string;
   destination : string;
   iscancel : boolean;
   TotalSeat : number;
   charge : number;
   route : mongoose.Types.ObjectId;
   stops : [{
    station : string;
    distance : number;
   }]
}