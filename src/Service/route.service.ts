import { injectable } from "inversify";
import { Iroute } from "../Interface/iroute.interface";
import Route from "../Model/route.model";
import { ApiError } from "../Utils/ApiError";
import { StatusCode } from "../Constant/statuscode";
import { errMSG, MSG } from "../Constant/message";
import mongoose from "mongoose";
import Bus from "../Model/bus.model";

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
                routename: RouteData.routeName,
                stations: RouteData.stations,
            });
            return {
                statusCode: StatusCode.OK,
                content: {
                    message: MSG.SUCCESS('Route created '),
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

    async getRouteById(RouteId: string) {
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
                    $match: {},
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                }
            ]);
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