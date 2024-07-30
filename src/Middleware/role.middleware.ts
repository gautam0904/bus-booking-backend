import { Request, Response, NextFunction } from "express";
import { BaseMiddleware } from "inversify-express-utils";
import { ApiError } from "../Utils/ApiError";
import { StatusCode } from "../Constant/statuscode";
import { errMSG } from "../Constant/message";

export class Role extends BaseMiddleware{
    
    handler(req: Request, res: Response, next: NextFunction): void {
        try {
            
            const permissions = {
                admin : ['/buses/get' , '/buses/create' , '/buses/update', '/buses/delete' ,'/user/get','/user/delete','/station/getAll' , '/station/create' , '/station/update', '/station/delete'],
                user : ['/buses/get' , '/bus/bookedSeat/' , '/bus/book/','/station/getAll'],
            }

            const role = req.headers.ROLE?.toString() ;

            if (!role) throw new ApiError(StatusCode.CONFLICT , errMSG.REQUIRED('User Role'))

            const currentRoute = req.protocol + "://" + req.get("host") + req.originalUrl;

            const parsedUrl = new URL(currentRoute);

            const pathname = parsedUrl.pathname;

            const userPermissions = permissions[role as keyof typeof permissions]

            const isPermitted = userPermissions.some(perm => pathname.startsWith(perm))

            if(!isPermitted) throw new ApiError(StatusCode.FORBIDDEN , errMSG.NOTVALIDROLE(role))
            
            next()

        } catch (error ) {            
            res.status(error.statuscode || StatusCode.INTERNALSERVERERROR).json({
                message : error.message || errMSG.DEFAULTERRORMSG
            })
        }
    }

}