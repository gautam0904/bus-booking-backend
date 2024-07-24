import { injectable } from "inversify";
import { StatusCode } from "../Constant/statuscode";
import { errMSG, MSG } from "../Constant/message";
import mongoose from "mongoose";
import BookedSeat from "../Model/bookedseat.model";
import { IbookedSeat } from "../Interface/ibookedSeat.interface";
import { Ifilter } from "../Interface/ifilter.interface";
import Bus from "../Model/bus.model";

@injectable()
export class BookedService {

    constructor() {
    }

    async booking(SeatDataData: IbookedSeat, userId: string) {
        try {


            const result = await BookedSeat.create({
                seatNumber: SeatDataData.seatNumber,
                departure: SeatDataData.departure,
                destination: SeatDataData.destination,
                departureTime: SeatDataData.departureTime,
                payment: SeatDataData.payment,
                seat: SeatDataData.seat,
                isSingleLady: SeatDataData.isSingleLady,
                bookingDate: SeatDataData.bookingDate,
                userId: userId,
                busId: SeatDataData.busId
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

            const busRoute = await Bus.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id)
                    }
                },
                {
                    $project: {
                        route: 1,
                        _id: 0
                    }
                }
            ]);


            let startIndex = busRoute[0].route.findIndex((item: any) => item.previousStation === filter.departure);
            let endIndex = busRoute[0].route.findIndex((item: any) => item.currentStation === filter.destination) + 1;

            const bookedRoute = busRoute[0].route.slice(startIndex, endIndex);

            console.log(bookedRoute);


            let bookedseats: any = []

            const seats = await BookedSeat.aggregate(
                [
                    {
                        $match: {
                            busId: new mongoose.Types.ObjectId("669f8398b9306a3b1bd9b51e")
                        }
                    },
                    {
                        $lookup: {
                            from: "buses",
                            localField: "busId",
                            foreignField: "_id",
                            as: "busresult"
                        }
                    },
                    { $unwind: "$busresult" },
                    {
                        $project: {
                            bookedBusroute: "$busresult.route",
                            seatNumber: 1,
                            departure: 1,
                            departureTime: 1,
                            destination: 1,
                            payment: 1,
                            seat: 1,
                            isSingleLady: 1,
                            bookingDate: 1,
                            userId: 1,
                            busId: 1
                        }
                    },
                    {
                        $set: {
                            startIndex: {
                                $indexOfArray: [
                                    "$bookedBusroute.previousStation",
                                    "$departure"
                                ]
                            }
                        }
                    },
                    {
                        $set: {
                            endIndex: {
                                $indexOfArray: [
                                    "$bookedBusroute.currentStation",
                                    "$destination"
                                ]
                            }
                        }
                    },
                    {
                        $set: {
                            route: {
                                $slice: [
                                    0, 2
                                ]
                            }
                        }
                    }
                ]
            )

            for (let i = 0; i < bookedRoute.length; i++) {

                const seat = await BookedSeat.aggregate([
                    {
                        $match: {
                            busId: new mongoose.Types.ObjectId(id),
                            $or: [
                                { departure: bookedRoute[i].previousStation }, { destination: bookedRoute[i].currentStation },


                            ]
                        }
                    },
                    {
                        $project: {
                            seatNumber: 1,
                            _id: 0
                        }
                    }
                ]);

                for (const s of seat) {
                    bookedseats.push(s);
                }

            }


            return {
                statusCode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Your seat is booked'),
                    data: bookedseats
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