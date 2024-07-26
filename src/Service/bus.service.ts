import { injectable } from "inversify";
import { IBus } from "../Interface/ibus.interface";
import Bus from "../Model/bus.model";
import { ApiError } from "../Utils/ApiError";
import { StatusCode } from "../Constant/statuscode";
import { errMSG, MSG } from "../Constant/message";
import mongoose from "mongoose";
import BookedSeat from "../Model/bookedseat.model";
import { Ifilter } from "../Interface/ifilter.interface";

@injectable()
export class BusService {

    constructor() {
    }

    async createBus(BusData: IBus) {
        try {
            const existBus = await Bus.findOne({
                departure: BusData.departure,
                destination: BusData.destination,
                departureTime: BusData.departureTime
            });

            if (existBus) {
                throw new ApiError(StatusCode.CONFLICT, errMSG.EXSISTBUS)
            }

            const newRoute = [];  
            const speed = 60;  
            
            function convertTimeToDate(timeString: string, baseDate: Date): Date {
                const [hours, minutes] = timeString.split(':').map(Number);
                const date = new Date(baseDate);
                date.setHours(hours, minutes, 0, 0);
                return date;
            }
            
            function calculateTravelTime(distance: number, speed: number): number {
                return (distance / speed) * 3600 * 1000; 
            }
            
            const baseDate = new Date();
            
            let currentArrivalTime = convertTimeToDate(BusData.departureTime, baseDate);
            
            for (let i = 0; i < BusData.route.length; i++) {
                let tempRoute = {
                    previousStation: '',
                    currentStation: '',
                    distance: 0,
                    arrivalTime: ''
                };
            
                const travelTime = calculateTravelTime(BusData.route[i].distance, speed);
                
                currentArrivalTime = new Date(currentArrivalTime.getTime() + travelTime);
            
                
                const hours = currentArrivalTime.getHours().toString().padStart(2, '0');
                const minutes = currentArrivalTime.getMinutes().toString().padStart(2, '0');
                tempRoute.arrivalTime = `${hours}:${minutes}`;
            
                tempRoute.previousStation = BusData.route[i].previousStation;
                tempRoute.currentStation = BusData.route[i].currentStation;
                tempRoute.distance = BusData.route[i].distance;
            
                newRoute.push(tempRoute);
            }
            

            const result = await Bus.create({
                busNumber: BusData.busNumber,
                departure: BusData.departure,
                departureTime: BusData.departureTime,
                destination: BusData.destination,
                TotalSeat: BusData.TotalSeat,
                charge: BusData.charge,
                route: newRoute
            });
            return {
                statusCode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Bus is created'),
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

    async deleteBus(BusId: string) {
        const session = await mongoose.startSession();

        session.startTransaction();

        try {
            const opts = { session };


            const existBus = await Bus.findOne({ _id: BusId });

            if (!existBus) {
                throw new ApiError(StatusCode.NOCONTENT, errMSG.NOTFOUND('bus'))
            }

            const deletedBus = await Bus.findOneAndDelete({ _id: BusId }, opts);

            await BookedSeat.deleteMany({ busId: BusId })

            await session.commitTransaction();

            return {
                statuscode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Bus is deleted'),
                    data: deletedBus
                }
            };
        } catch (error) {

            await session.abortTransaction();

            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                content: { message: error.message },
            };
        } finally {
            session.endSession();
        }
    }

    async getBusById(BusId: string) {
        try {
            const existBus = await Bus.findById(BusId)
            if (!Bus) throw new ApiError(StatusCode.NOCONTENT, errMSG.NOTFOUND('Bus'))
            return {
                statuscode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Buses get '),
                    data: existBus
                },
            };

        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                content: { message: error.message || errMSG.DEFAULTERRORMSG, },

            }
        }
    }

    async getAll() {
        try {
            const getBus = await Bus.find()
            if (!Bus) throw new ApiError(StatusCode.NOCONTENT, errMSG.NOTFOUND('Bus'))
            return {
                statuscode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Buses get'),
                    data: getBus
                },
            };

        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                content: { message: error.message || errMSG.DEFAULTERRORMSG, },

            }
        }
    }

    async getFilteredBus(filter: Ifilter | null = null) {
        try {
            const Buss = await Bus.aggregate([
                {
                    $match: {
                        route: {
                            $elemMatch: {
                                previousStation: filter?.departure
                            }
                        }
                    }
                },
                {
                    $set: {
                        startIndex: { $indexOfArray: ["$route.previousStation", filter?.departure] }
                    }
                },
                {
                    $set: {
                        route: { $slice: ["$route", "$startIndex", { $size: "$route" }] }
                    }
                },
                {
                    $match: {
                        route: {
                            $elemMatch: {
                                currentStation: filter?.destination
                            }
                        }
                    }
                }
            ])

            if (Buss.length == 0) {
                throw new ApiError(StatusCode.NOTFOUND, `${errMSG.NOTFOUND('Bus')}`);
            }
            return {
                statuscode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Buses get '),
                    data: Buss
                },
            };
        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                content: { message: error.message },
            };
        }
    }

    async updateBus(updateData: IBus) {
        try {

            const result = await Bus.findByIdAndUpdate(
                {
                    _id: updateData._id,
                },
                {
                    $set: {
                        busNumber: updateData.busNumber,
                        departure: updateData.departure,
                        iscancel: updateData.iscancel,
                        departureTime: updateData.departureTime,
                        destination: updateData.destination,
                        TotalSeat: updateData.TotalSeat,
                        charge: updateData.charge,
                        route: updateData.route
                    },
                },
                { new: true }
            );
            if (result) {
                return {
                    statuscode: StatusCode.OK,
                    Content: result,
                };
            }
            throw new ApiError(StatusCode.NOTIMPLEMENTED, errMSG.UPDATEBUS);
        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                Content: error.message,
            };
        }
    }


}