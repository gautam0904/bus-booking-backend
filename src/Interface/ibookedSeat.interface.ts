export interface IbookedSeat{
    seatNumber : number;
    departure : string;
    departureTime : string;
    destination : string;
    payment : number;
    seat : number;
    isSingleLady : boolean;
    bookingDate : Date;
    userId : string;
    busId : string;
    mobileNo : string
    passenger : [{
        name : string;
        age : number;
        gender : string
    }]
 }