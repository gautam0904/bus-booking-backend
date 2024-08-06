import { inject, injectable } from "inversify";
import { IBus } from "../Interface/ibus.interface";
import Bus from "../Model/bus.model";
import { ApiError } from "../Utils/ApiError";
import { StatusCode } from "../Constant/statuscode";
import { errMSG, MSG } from "../Constant/message";
import mongoose from "mongoose";
import BookedSeat from "../Model/bookedseat.model";
import { Ifilter } from "../Interface/ifilter.interface";
import { StationService } from "./station.service";
import { Types } from "../Types/types";
import Segment from "../Model/segment.model";

@injectable()
export class BusService {
    private stationService: StationService;

    constructor(@inject(Types.StationService) stationService: StationService) {
        this.stationService = stationService;

    }

    async createBus(BusData: IBus) {
        try {
            console.log(BusData);
            
            const existBus = await Bus.findOne({
                departure: BusData.departure,
                destination: BusData.destination,
                departureTime: BusData.departureTime
            });

            if (existBus) {
                throw new ApiError(StatusCode.CONFLICT, errMSG.EXSISTBUS)
            }

            const newstops = [];
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

            for (let i = 0; i < BusData.stops.length; i++) {
                let tempstation = {
                    station: '',
                    distance: 0,
                    arrivalTime: ''
                };

                const travelTime = calculateTravelTime(BusData.stops[i].distance, speed);

                currentArrivalTime = new Date(currentArrivalTime.getTime() + travelTime);


                const hours = currentArrivalTime.getHours().toString().padStart(2, '0');
                const minutes = currentArrivalTime.getMinutes().toString().padStart(2, '0');
                tempstation.arrivalTime = `${hours}:${minutes}`;
                tempstation.station = BusData.stops[i].station;
                tempstation.distance = BusData.stops[i].distance;

                newstops.push(tempstation);
            }




            const result = await Bus.create({
                busNumber: BusData.busNumber,
                departure: BusData.departure,
                departureTime: BusData.departureTime,
                destination: BusData.destination,
                TotalSeat: BusData.TotalSeat,
                charge: BusData.charge,
                route: BusData.route,
                stops: newstops
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

    toCamelCase(str: string) {
        return str
          .split(' ')
          .map((word, index) => {
            if (index === 0) {
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join('');
      }

    async getFilteredBus(filter: Ifilter | null = null) {
        try {
            if(!filter){
                throw new ApiError(StatusCode.FORBIDDEN , errMSG.REQUIRED('proper search Data'))
            }
            filter.station = this.toCamelCase(filter.departure);
            
            await this.stationService.getFilteredStation(filter).then((res) => {
                filter.departure = res.content.data?._id.toString() as string
            } );

            filter.station = this.toCamelCase(filter.destination);
            
            await this.stationService.getFilteredStation(filter).then((res) => {
                filter.destination = res.content.data?._id.toString() as string
            } );

            const busResult = await Segment.aggregate([
                {
                  "$match": {
                    "fromStation": new mongoose.Types.ObjectId(filter.departure),
                    "toStation": new mongoose.Types.ObjectId(filter.destination)
                  }
                },
                {
                  "$lookup": {
                    "from": "buses",
                    "localField": "routeId",
                    "foreignField": "route",
                    "as": "bus"
                  }
                },
                {
                  "$unwind": {
                    "path": "$bus"
                  }
                },
                {
                  "$replaceRoot": {
                    "newRoot": "$bus"
                  }
                },
                {
                  "$addFields": {
                    "isFromStationPresent": {
                      "$cond": {
                        "if": {
                          "$gt": [
                            {
                              "$size": {
                                "$filter": {
                                  "input": "$stops",
                                  "as": "detail",
                                  "cond": {
                                    "$eq": [
                                      "$$detail.station",
                                      new mongoose.Types.ObjectId(filter.departure)
                                    ]
                                  }
                                }
                              }
                            },
                            0
                          ]
                        },
                        "then": true,
                        "else": false
                      }
                    },
                    "isToStationPresent": {
                      "$cond": {
                        "if": {
                          "$gt": [
                            {
                              "$size": {
                                "$filter": {
                                  "input": "$stops",
                                  "as": "detail",
                                  "cond": {
                                    "$eq": [
                                      "$$detail.station",
                                      new mongoose.Types.ObjectId(filter.destination)
                                    ]
                                  }
                                }
                              }
                            },
                            0
                          ]
                        },
                        "then": true,
                        "else": false
                      }
                    }
                  }
                },
                {
                  "$match": {
                    "isFromStationPresent": true,
                    "isToStationPresent": true
                  }
                },
                {
                  "$lookup": {
                    "from": "stations",
                    "localField": "stops.station",
                    "foreignField": "_id",
                    "as": "stationDetails"
                  }
                },
                {
                  "$addFields": {
                    "stops": {
                      "$map": {
                        "input": "$stops",
                        "as": "stop",
                        "in": {
                          "station": "$$stop.station",
                          "arrivalTime" : "$$stop.arrivalTime",
                          "distance" : "$$stop.distance",
                          "stationName": {
                            "$arrayElemAt": [
                              {
                                "$map": {
                                  "input": {
                                    "$filter": {
                                      "input": "$stationDetails",
                                      "as": "detail",
                                      "cond": {
                                        "$eq": [
                                          "$$detail._id",
                                          "$$stop.station"
                                        ]
                                      }
                                    }
                                  },
                                  "as": "station",
                                  "in": "$$station.station"
                                }
                              },
                              0
                            ]
                          }
                        }
                      }
                    }
                  }
                },
                {
                  "$project": {
                    "isFromStationPresent": 0,
                    "isToStationPresent": 0,
                    "stationDetails": 0
                  }
                }
              ]
              )
            if (busResult.length == 0) {
                throw new ApiError(StatusCode.NOTFOUND, `${errMSG.NOTFOUND('Bus')}`);
            }
            return {
                statuscode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Buses get '),
                    data: busResult
                },
            };
        } catch (error) {
            console.log(error);
            
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
                    _id: new mongoose.Types.ObjectId(updateData._id),
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
            if (!result) {
                throw new ApiError(StatusCode.NOTIMPLEMENTED, errMSG.UPDATEBUS);
            }
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