import { controller, httpDelete, httpGet, httpPost, httpPut } from "inversify-express-utils";
import { inject } from "inversify";
import { Types } from "../Types/types";
import { Istation } from "../Interface/istation.interface";
import { Request, Response } from "express";
import { StatusCode } from "../Constant/statuscode";
import { errMSG } from "../Constant/message";
import { ApiError } from "../Utils/ApiError";
import { Auth } from "../Middleware/auth.middleware";
import { Role } from "../Middleware/role.middleware";
import { StationService } from "../Service";

@controller('/station')

export class StationController {
  private stationService: StationService;

  constructor(@inject(Types.StationService) stationService: StationService) {
    this.stationService = stationService;

  }

  @httpPost('/create')
  async create(req: Request, res: Response) {
    try {

      const stationData: Istation = req.body as Istation;

      const created_station = await this.stationService.createStation(stationData);

      res.status(created_station.statusCode).json(created_station.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
    }
  }

  @httpDelete('/delete/:id?')
  async delete(req: Request, res: Response) {
      try {
          const stationId = req.params.id;
          if (!stationId) {
              throw new ApiError(StatusCode.NOTACCEPTABLE, errMSG.NOTFOUND('station'));
          }

          const deleted_station = await this.stationService.deleteStation(stationId );

          res.status(deleted_station.statuscode).json(deleted_station.content);
      } catch (error) {
          res.status(error.StatusCode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
      }
  }

  
  @httpPut('/update/:id?', new Auth().handler, new Role().handler)
  async update(req: Request, res: Response) {
    try {

      const updateData: Istation = req.body as Istation;

      const stationId = req.params.id as string;

      const updated_station = await this.stationService.updateStation(updateData , stationId);

      res.status(updated_station.statuscode).json(updated_station.Content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
    }
  }

  @httpGet('/getAll', new Auth().handler)
  async getAll(req: Request, res: Response) {
    try {
      const allstations = await this.stationService.getAllStation();

      res.status(allstations.statuscode).json(allstations.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT });
    }
  }
}
