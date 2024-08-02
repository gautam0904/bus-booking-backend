import { injectable } from "inversify";
import { Istation } from "../Interface/istation.interface"
import Station from "../Model/station.model";
import { ApiError } from "../Utils/ApiError";
import { StatusCode } from "../Constant/statuscode";
import { errMSG, MSG } from "../Constant/message";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose, { ClientSession } from "mongoose";
import Bus from "../Model/bus.model";
import { Ifilter } from "../Interface/ifilter.interface";

@injectable()
export class StationService {

    constructor() {
    }

    async createStation(StationData: Istation) {
        try {
            const existStation = await Station.findOne({ station: StationData.station });

            if (existStation) {
                throw new ApiError(StatusCode.CONFLICT, errMSG.EXSIT('This Staion'))
            }

            const result = await Station.create({
                station: StationData.station
            });
            return {
                statusCode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Station Created'),
                    data: result
                }
            }
        } catch (error) {

            return {
                statusCode: StatusCode.OK,
                content: {
                    message: error.message || errMSG.INTERNALSERVERERRORRESULT,
                }
            }
        }
    }



    async deleteStation(stationId: string) {
        const session: ClientSession = await mongoose.startSession();
        session.startTransaction();

        try {
            const opts = { session };

            const existStation = await Station.findById(stationId).session(session);
            if (!existStation) {
                throw new ApiError(StatusCode.NOTFOUND, errMSG.NOTFOUND('Station'));
            }

            const deletedStation = await Station.findByIdAndDelete(stationId, opts);
            if (!deletedStation) {
                throw new ApiError(StatusCode.NOTFOUND, errMSG.NOTFOUND('Station'));
            }

            const buses = await Bus.find({ 'stops.Station': stationId }).session(session);

            await session.commitTransaction();

            return {
                statuscode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Station is deleted'),
                    data: deletedStation
                }
            };
        } catch (error) {
            await session.abortTransaction();

            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                content: { message: error.message }
            };
        } finally {
            session.endSession();
        }
    }



    //   async deleteStation(stationId: string , StationOwnId: string) {
    //     const session = await mongoose.startSession();

    //     session.startTransaction();

    //     try {
    //       const opts = { session };


    //       const existStation = await Station.findOne({ _id: stationId });
    //       if (!existStation) {
    //         throw new ApiError(StatusCode.NOTFOUND, errMSG.NOTFOUND('Staion'));
    //       }

    //       const deletedStation = await Station.findOneAndDelete({ _id: stationId },opts);

    //       const buses = await Bus.find({
    //         'stops.Station': stationId
    //     });

    //     for (const bus of buses) {
    //         const updatedStops = bus.stops.filter(stop => stop.Station.toString() !== stationId.toString());
    //         bus.stops = updatedStops;

    //         // Save the updated bus
    //         await bus.save();
    //     }

    //     for (const bus of buses) {
    //         bus.stops = bus.stops.filter(stop => stop.Station !== stationId);

    //         // Save the updated bus
    //         await bus.save();
    //     }

    //       await session.commitTransaction();

    //       return {
    //         statuscode: StatusCode.OK,
    //         content: {
    //           message: MSG.SUCCESS('Station is deleted'),
    //           data: deletedStation
    //         }
    //       };
    //     } catch (error) {

    //       await session.abortTransaction();

    //       return {
    //         statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
    //         content: { message: error.message },
    //       };
    //     } finally {
    //       session.endSession();
    //     }
    //   }

    async getStationById(StationId: string) {
        try {
            const station = await Station.findById(StationId)
            if (!station) throw new ApiError(StatusCode.NOCONTENT, errMSG.NOTFOUND('This Station'))

            return {
                statuscode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Station get '),
                    data: station
                },
            }


        } catch (error) {
            return {
                statuscode: error.statuscode || StatusCode.INTERNALSERVERERROR,
                content : {
                    message: error.message || errMSG.DEFAULTERRORMSG,
                }
            }
        }
    }

    async getFilteredStation(filter: Ifilter | null = null) {
        try {            
            const station = await Station.findOne({station : filter?.station})

            if (!station) {
                throw new ApiError(StatusCode.NOTFOUND, `${errMSG.NOTFOUND('Station')}`);
            }
            return {
                statuscode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Station get '),
                    data: station
                },
            };
        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                content: { message: error.message },
            };
        }
    }


    async getAllStation() {
        try {
            const Stations = await Station.aggregate([
                {
                    $match: {},
                },
                {
                    $sort: {
                        station: 1
                    }
                }
            ]);
            if (Stations) {
                return {
                    statuscode: StatusCode.OK,
                    content: {
                        message: MSG.SUCCESS('Stations get '),
                        data: Stations
                    },
                };
            } else {
                throw new ApiError(StatusCode.NOTFOUND, `${errMSG.NOTFOUND('station')}`);
            }
        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                content: { message: error.message },
            };
        }
    }

    async updateStation(updateData: Istation , id : string) {
        try {

            const existStation = await Station.findById(updateData._id);

            if (!existStation) {
                throw new ApiError(StatusCode.NOTFOUND, errMSG.NOTFOUND('staion'));
            }


            const result = await Station.findByIdAndUpdate(
                {
                    _id: new mongoose.Types.ObjectId(id),
                },
                {
                    $set: {
                        station: updateData.station
                    },
                },
                { new: true }
            );

            return {
                statuscode: StatusCode.OK,
                Content: result,
            };

        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                Content: error.message,
            };
        }
    }
}