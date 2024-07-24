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

            const result = await Bus.create({
                busNumber : BusData.busNumber,
                departure: BusData.departure,
                departureTime: BusData.departureTime,
                destination: BusData.destination,
                TotalSeat: BusData.TotalSeat,
                charge: BusData.charge,
                route:BusData.route
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
                throw new ApiError(StatusCode.NOCONTENT , errMSG.NOTFOUND('bus'))
            }
      
            const deletedBus = await Bus.findOneAndDelete({ _id: BusId }, opts);

            await BookedSeat.deleteMany({busId : BusId})

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
                    startIndex: { $indexOfArray: [ "$route.previousStation", filter?.departure ] }
                  }
                },
                {
                  $set: {
                    route: { $slice: [ "$route", "$startIndex", { $size: "$route" } ] }
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

            if (Buss.length ==0 ) {
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
                        busNumber : updateData.busNumber,
                        departure: updateData.departure,
                        iscancel : updateData.iscancel,
                        departureTime: updateData.departureTime,
                        destination: updateData.destination,
                        TotalSeat: updateData.TotalSeat,
                        charge: updateData.charge,
                        route:updateData.route
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