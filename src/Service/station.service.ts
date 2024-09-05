import { injectable } from "inversify";
import { Istation } from "../Interface/istation.interface"
import Station from "../Model/station.model";
import { ApiError } from "../Utils/ApiError";
import { StatusCode } from "../Constant/statuscode";
import { errMSG, MSG } from "../Constant/message";
import mongoose, { ClientSession } from "mongoose";
import Bus from "../Model/bus.model";
import { Ifilter } from "../Interface/ifilter.interface";
import { IBus } from "../Interface/ibus.interface";
import Route from "../Model/route.model";
import { Iroute } from "../Interface/iroute.interface";

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

            const deleteBuses: IBus[] = await Bus.aggregate([
                    {
                      '$addFields': {
                        'isStationFirstPresent': {
                          '$first': '$stops'
                        }
                      }
                    }, {
                      '$addFields': {
                        'isStationLastPresent': {
                          '$last': '$stops'
                        }
                      }
                    },
                    {
                        '$match': {
                            '$or': [
                                {
                                    'isStationFirstPresent.station': new mongoose.Types.ObjectId(stationId)
                                }, {
                                    'isStationLastPresent.station': new mongoose.Types.ObjectId(stationId)
                                }
                            ]
                        }
                    }
                  ])        

            const deleteBusPromises = deleteBuses.map(async (b) => {
                try {
                    const rb = await Bus.findByIdAndDelete(
                        {
                            _id: new mongoose.Types.ObjectId(b._id),
                        }
                    );

                    return rb;
                } catch (error) {
                    return error
                }
            });

            await Promise.all(deleteBusPromises);

            const updateBuses: IBus[] = await Bus.aggregate([
                {
                    '$addFields': {
                        'isStationPresent': {
                            '$cond': {
                                'if': {
                                    '$gt': [
                                        {
                                            '$size': {
                                                '$filter': {
                                                    'input': '$stops',
                                                    'as': 'detail',
                                                    'cond': {
                                                        '$eq': [
                                                            '$$detail.station', new mongoose.Types.ObjectId(stationId)
                                                        ]
                                                    }
                                                }
                                            }
                                        }, 0
                                    ]
                                },
                                'then': true,
                                'else': false
                            }
                        }
                    }
                }, {
                    '$match': {
                        'isStationPresent': true
                    }
                }, {
                    '$project': {
                        'isStationPresent': 0
                    }
                }
            ]);



            const updateBusPromises = updateBuses.map(async (b) => {
                try {

                    const newStops = b.stops.filter(st => st.station != (new mongoose.Types.ObjectId(stationId).toString()));                  

                    const rb = await Bus.findByIdAndUpdate(
                        {
                            _id: new mongoose.Types.ObjectId(b._id),
                        },
                        {
                            $set: {
                                stops: newStops
                            },
                        },
                        { new: true }
                    );

                    return rb;
                } catch (error) {
                    return error
                }
            });

            await Promise.all(updateBusPromises);

            const deleteRoute: Iroute[] = await Route.aggregate([
                {
                    '$addFields': {
                        'isStationFirstPresent': {
                            '$first': '$stations'
                        }
                    }
                }, {
                    '$addFields': {
                        'isStationLastPresent': {
                            '$last': '$stations'
                        }
                    }
                }, {
                    '$match': {
                        '$or': [
                            {
                                'isStationFirstPresent.station': new mongoose.Types.ObjectId(stationId)
                            }, {
                                'isStationLastPresent.station': new mongoose.Types.ObjectId(stationId)
                            }
                        ]
                    }
                }
            ])

            const deleteRoutePromise = deleteRoute.map(async (r) => {
                try {
                    const resultRoute = await Route.findByIdAndDelete(
                        {
                            _id: new mongoose.Types.ObjectId(r._id),
                        }
                    );

                    return resultRoute;
                } catch (error) {
                    return error
                }
            });

            await Promise.all(deleteRoutePromise);

            const updateRoute: Iroute[] = await Route.aggregate([
                {
                    '$addFields': {
                        'isStationPresent': {
                            '$cond': {
                                'if': {
                                    '$gt': [
                                        {
                                            '$size': {
                                                '$filter': {
                                                    'input': '$stations',
                                                    'as': 'detail',
                                                    'cond': {
                                                        '$eq': [
                                                            '$$detail.station', new mongoose.Types.ObjectId(stationId)
                                                        ]
                                                    }
                                                }
                                            }
                                        }, 0
                                    ]
                                },
                                'then': true,
                                'else': false
                            }
                        }
                    }
                }, {
                    '$match': {
                        'isStationPresent': true
                    }
                }, {
                    '$project': {
                        'isStationPresent': 0
                    }
                }
            ])


            const updateRoutePromises = updateRoute.map(async (r) => {
                try {
                    const newStations = r.stations.filter(st => st.station != (new mongoose.Types.ObjectId(stationId).toString()))
                    const resultRoute = await Route.findByIdAndUpdate(
                        {
                            _id: new mongoose.Types.ObjectId(r._id),
                        },
                        {
                            $set: {
                                stations: newStations
                            },
                        },
                        { new: true }
                    );

                    return resultRoute;
                } catch (error) {
                    return error
                }
            });

            await Promise.all(updateRoutePromises);

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
                content: {
                    message: error.message || errMSG.DEFAULTERRORMSG,
                }
            }
        }
    }

    async getFilteredStation(filter: Ifilter | null = null) {
        try {
            const station = await Station.findOne({ station: filter?.station })

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

    async updateStation(updateData: Istation, id: string) {
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
                Content: {
                    message: MSG.SUCCESS('station is updated'),
                    data: result
                },
            };

        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                Content: error.message,
            };
        }
    }
}