import { controller, httpDelete, httpGet, httpPost, httpPut } from "inversify-express-utils";
import { RouteService } from "../Service";
import { inject } from "inversify";
import { Types } from "../Types/types";
import { Iroute } from "../Interface/iroute.interface";
import { Request, Response } from "express";
import { StatusCode } from "../Constant/statuscode";
import { errMSG } from "../Constant/message";
import { ApiError } from "../Utils/ApiError";
import { Auth } from "../Middleware/auth.middleware";
import { Role } from "../Middleware/role.middleware";

@controller('/route')

export class RouteController {
  private routeService: RouteService;

  constructor(@inject(Types.RouteService) routeServices: RouteService) {
    this.routeService = routeServices;

  }

  @httpPost('/cretae')
  async signup(req: Request, res: Response) {
    try {

      const routeData: Iroute = req.body as unknown as Iroute;

      const created_route = await this.routeService.createRoute(routeData);

      res.status(created_route.statusCode).json(created_route.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
    }
  }




  @httpDelete('/delete/:id?')
  async delete(req: Request, res: Response) {
      try {
          const routeId = req.params.id;
          if (!routeId) {
              throw new ApiError(StatusCode.NOTACCEPTABLE, errMSG.NOTFOUND('Route'));
          }

          const deleted_route = await this.routeService.deleteRoute(routeId);

          res.status(deleted_route.statuscode).json(deleted_route.content);
      } catch (error) {
          res.status(error.StatusCode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
      }
  }

  
  @httpPut('/update/:id?', new Auth().handler, new Role().handler)
  async update(req: Request, res: Response) {
    try {

      const updateData: Iroute = req.body as Iroute;

      const routeId = req.params.id as string;

      const updated_route = await this.routeService.updateRoute(updateData ,routeId );

      res.status(updated_route.statuscode).json(updated_route.Content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
    }
  }

  @httpGet('/getAll', new Auth().handler)
  async getAll(req: Request, res: Response) {
    try {
      const allroutes = await this.routeService.getAllRoute();

      res.status(allroutes.statuscode).json(allroutes.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT });
    }
  }
}
