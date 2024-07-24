export interface IBus{
   _id ?: string;
   busNumber : string;
   departure : string;
   departureTime : string;
   destination : string;
   iscancel : boolean;
   TotalSeat : number;
   charge : number;
   route :[{
    previousStation : string;
    currentStation : string;
    distance : number;
   }]
}