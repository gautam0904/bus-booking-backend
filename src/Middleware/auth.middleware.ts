import { Request, Response, NextFunction } from "express";
import { BaseMiddleware } from "inversify-express-utils";
import jwt from "jsonwebtoken";
import { ApiError } from "../Utils/ApiError";
import { StatusCode } from "../Constant/statuscode";
import { errMSG } from "../Constant/message";


export class Auth extends BaseMiddleware{
    handler(req: Request, res: Response, next: NextFunction): void {
        try {
            const token = req.headers.authorization;

            if (!token) {
                throw new ApiError(StatusCode.UNAUTHORIZED , errMSG.REQUIRED('Access token'))
            }

            const tokenArray = token?.split(" ");

            if(tokenArray[0] !== "Bearer"){
                throw new ApiError(StatusCode.FORBIDDEN , errMSG.REQUIRED('Bearer token'))
            }

            jwt.verify(tokenArray[1] , process.env.AccessTokenSeceret as string , (err , decoded :any)=>{
                if (err){
                    throw new ApiError(StatusCode.UNAUTHORIZED , errMSG.EXPIREDTOKEN)
                }
                req.headers.USERID = decoded.id;
                req.headers.ROLE = decoded.role;
        
                next()
            })
             
        } catch (error ) {
            res.status(error.statuscode || StatusCode.INTERNALSERVERERROR).json({
                message : error.message || errMSG.DEFAULTERRORMSG
            })
        }
    }
}