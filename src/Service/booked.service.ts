import { injectable } from "inversify";
import { StatusCode } from "../Constant/statuscode";
import { errMSG, MSG } from "../Constant/message";
import mongoose from "mongoose";
import BookedSeat from "../Model/bookedseat.model";
import { IbookedSeat } from "../Interface/ibookedSeat.interface";
import { Ifilter } from "../Interface/ifilter.interface";

@injectable()
export class BookedService {

    constructor() {
    }

    async booking(SeatData: IbookedSeat, userId: string) {
        console.log(SeatData);
        
        try {

            if (!SeatData.isSingleLady) {
                SeatData.isSingleLady = false;
            }

            const result = await BookedSeat.create({
                seatNumber: SeatData.seatNumber,
                departure: SeatData.departure,
                destination: SeatData.destination,
                departureTime: SeatData.departureTime,
                payment: SeatData.payment,
                seat: SeatData.seat,
                isSingleLady: SeatData.isSingleLady,
                passenger : SeatData.passenger,
                bookingDate: SeatData.bookingDate,
                mobileNo : SeatData.mobileNo,
                userId: userId,
                busId: SeatData.busId
            });
            return {
                statusCode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Your seat is booked'),
                    data: result
                }
            }
        } catch (error) {

            return {
                statusCode: error.statuscode || StatusCode.INTERNALSERVERERROR,
                content: {
                    message: error.message || errMSG.INTERNALSERVERERRORRESULT,
                }
            }
        }
    }

    async availableSeat(filter: Ifilter, id: string) {
        try {
            const seats = await BookedSeat.aggregate(
                [
                    {
                        '$match': {
                            'busId': new mongoose.Types.ObjectId(id),
                            'bookingDate' : new Date(filter.date)
                        }
                    }, {
                        '$lookup': {
                            'from': 'buses',
                            'localField': 'busId',
                            'foreignField': '_id',
                            'as': 'bus'
                        }
                    }, {
                        '$unwind': '$bus'
                    }, {
                        '$addFields': {
                            'wantedRouteStartIndex': {
                                '$indexOfArray': [
                                    '$bus.route.previousStation', filter.departure
                                ]
                            },
                            'wantedRouteEndIndex': {
                                '$add': [
                                    {
                                        '$indexOfArray': [
                                            '$bus.route.currentStation', filter.destination
                                        ]
                                    }, 1
                                ]
                            }
                        }
                    }, {
                        '$addFields': {
                            'wantedRoute': {
                                '$slice': [
                                    '$bus.route', '$wantedRouteStartIndex', {
                                        '$subtract': [
                                            '$wantedRouteEndIndex', '$wantedRouteStartIndex'
                                        ]
                                    }
                                ]
                            }
                        }
                    }, {
                        '$project': {
                            'route': '$bus.route',
                            'seatNumber': 1,
                            'departure': 1,
                            'departureTime': 1,
                            'destination': 1,
                            'payment': 1,
                            'seat': 1,
                            'isSingleLady': 1,
                            'bookingDate': 1,
                            'userId': 1,
                            'busId': 1,
                            'wantedRoute': 1
                        }
                    }, {
                        '$match': {
                            '$expr': {
                                '$setIntersection': [
                                    {
                                        '$map': {
                                            'input': '$wantedRoute',
                                            'as': 'wantRoute',
                                            'in': {
                                                '$arrayElemAt': [
                                                    {
                                                        '$filter': {
                                                            'input': '$userRoute',
                                                            'cond': {
                                                                '$or': [
                                                                    {
                                                                        '$eq': [
                                                                            '$$this.previousStation', '$$wantRoute.previousStation'
                                                                        ]
                                                                    }, {
                                                                        '$eq': [
                                                                            '$$this.currentStation', '$$wantRoute.currentStation'
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    }, 0
                                                ]
                                            }
                                        }
                                    }, '$wantedRoute'
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            seatNumber: 1,
                            _id: 0,
                            isSingleLady : 1
                        }
                    }
                ]);
            return {
                statusCode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Your seat is booked'),
                    data: seats
                }
            };
        } catch (error) {
            console.error(error);

            return {
                statusCode: StatusCode.OK,
                content: {
                    message: error.message || errMSG.INTERNALSERVERERRORRESULT
                }
            };
        }
    }
}