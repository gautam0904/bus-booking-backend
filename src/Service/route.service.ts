import { injectable } from "inversify";
import { Iroute } from "../Interface/iroute.interface";
import Route from "../Model/route.model";
import { ApiError } from "../Utils/ApiError";
import { StatusCode } from "../Constant/statuscode";
import { errMSG, MSG } from "../Constant/message";
import mongoose from "mongoose";
import Bus from "../Model/bus.model";
import Segment from "../Model/segment.model";

@injectable()
export class RouteService {

    constructor() {
    }

    async createRoute(RouteData: Iroute) {
        try {
            const existRoute = await Route.findOne({ routename : RouteData.routeName });

            if (existRoute) {
                throw new ApiError(StatusCode.CONFLICT, errMSG.EXSIT('This route'))
            }
            
            const result = await Route.create({
                routeName: RouteData.routeName,
                stations: RouteData.stations,
            });
            const segmentResult  = await this.generateSegments(result._id.toString());

            if (segmentResult instanceof ApiError || segmentResult instanceof Error) {
                throw segmentResult; 
            }
            return {
                statusCode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Route created '),
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

    async generateSegments(routeId : string) {
        try {
            const route = await Route.findById(routeId).populate('stations.station').exec();
            
            if (!route) {
                throw new ApiError(StatusCode.NOTFOUND, 'Route not found');
            }
              
            const segments = [];
    
            for (let i = 0; i < route.stations.length; i++) {
                for (let j = i + 1; j < route.stations.length; j++) {
                    const startStation = route.stations[i];
                    const endStation = route.stations[j];
                    
                    const segment = {
                        routeId: new mongoose.Types.ObjectId(routeId),
                        fromStation: new mongoose.Types.ObjectId(startStation.station._id),
                        toStation: new mongoose.Types.ObjectId(endStation.station._id),
                        distance: endStation.distanceFromStart - startStation.distanceFromStart
                    };
                    segments.push(segment);
                }
            }
            
            const segmentPromises = segments.map(async (s) => {
                try {
                    const rs = await Segment.create({
                        routeId ,
                        fromStation: s.fromStation,
                        toStation: s.toStation,
                        distance: s.distance
                    });
                    return rs;
                } catch (error) {
                    return error
                }
            });
    
             await Promise.all(segmentPromises);
                
            return segments;
        } catch (err) {
            return err;
        }
    }
      async deleteRoute(RouteId: string ) {
        const session = await mongoose.startSession();

        session.startTransaction();

        try {
          const opts = { session };


          const existRoute = await Route.findOne({ _id: RouteId });
          if (!existRoute) {
            throw new ApiError(StatusCode.NOTFOUND, errMSG.NOTFOUND('This route'));
          }

          const deletedRoute = await Route.findOneAndDelete({ _id: RouteId },opts);

          await Bus.deleteMany({route : RouteId})
          await Segment.deleteMany({ routeId: RouteId })

          await session.commitTransaction();

          return {
            statuscode: StatusCode.OK,
            content: {
              message: MSG.SUCCESS('Route is deleted'),
              data: deletedRoute
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

    async getRouteById(RouteId : string) {
        try {
            const route = await Route.findById(RouteId)
            if (!Route) throw new ApiError(StatusCode.NOCONTENT, errMSG.NOTFOUND('This Route'))

            return {
                statuscode: StatusCode.OK,
                content: {
                  message: MSG.SUCCESS('Route is get'),
                  data: route
                }
            }


        } catch (error) {
            return {
                message: error.message || errMSG.DEFAULTERRORMSG,
            }
        }
    }

    async getAllRoute() {
        try {
            const Routes = await Route.aggregate([
                {
                  "$match": {
                    
                  }
                },
                {
                  "$lookup": {
                    "from": "stations",
                    "localField": "stations.station",  
                    "foreignField": "_id",  
                    "as": "stationDetails"  
                  }
                },
                {
                  "$addFields": {
                    "stations": {
                      "$map": {
                        "input": "$stations",
                        "as": "station",
                        "in": {
                          "order": "$$station.order",
                          "distanceFromStart": "$$station.distanceFromStart",
                          "_id": "$$station._id",
                          "stationName": {
                            "$let": {
                              "vars": {
                                "stationDetail": {
                                  "$arrayElemAt": [
                                    {
                                      "$filter": {
                                        "input": "$stationDetails",
                                        "as": "detail",
                                        "cond": { "$eq": ["$$detail._id", "$$station.station"] }
                                      }
                                    },
                                    0
                                  ]
                                }
                              },
                              "in": { "$ifNull": ["$$stationDetail.station", "Unknown"] }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                {
                  "$project": {
                    "stationDetails": 0
                  }
                }
              ]
              );
            if (Routes) {
                return {
                    statuscode: StatusCode.OK,
                    content: {
                        message: MSG.SUCCESS('Routes get '),
                        data: Routes
                    },
                };
            } else {
                throw new ApiError(StatusCode.NOTFOUND, `${errMSG.NOTFOUND('Routes')}`);
            }
        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                content: { message: error.message },
            };
        }
    }

     async updateRoute(updateData: Iroute , id : string) {
        try {

            const existRoute = await Route.findById(updateData._id);

            if (!existRoute) {
                throw new ApiError(StatusCode.NOTFOUND, errMSG.NOTFOUND('This route'));
            }


            const result = await Route.findByIdAndUpdate(
                {
                    _id: new mongoose.Types.ObjectId(id)
                },
                {
                    $set: {
                       routeName : updateData.routeName,
                       stations : updateData.stations
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