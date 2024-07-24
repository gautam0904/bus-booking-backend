import { controller, httpDelete, httpGet, httpPost, httpPut } from "inversify-express-utils";
import { BusService } from "../Service";
import { inject } from "inversify";
import { Types } from "../Types/types";
import { IBus } from "../Interface/ibus.interface";
import { Request, Response } from "express";
import { StatusCode } from "../Constant/statuscode";
import { errMSG } from "../Constant/message";
import { ApiError } from "../Utils/ApiError";
import { Auth } from "../Middleware/auth.middleware";
import { Role } from "../Middleware/role.middleware";
import { Ifilter } from "../Interface/ifilter.interface";

@controller('/buses' , new Auth().handler)

export class BusController {
  private busService: BusService;

  constructor(@inject(Types.BusService) busServices: BusService) {
    this.busService = busServices;

  }

  @httpPost('/create' ,new Role().handler)
  async create(req: Request, res: Response) {
    try {

      const busData: IBus = req.body as IBus;

      const created_Bus = await this.busService.createBus(busData);

      res.status(created_Bus.statusCode).json(created_Bus.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
    }
  }

  @httpDelete('/delete/:id?' ,new Role().handler)
  async delete(req: Request, res: Response) {
      try {
          const BusId = req.params.id;
          if (!BusId) {
              throw new ApiError(StatusCode.NOTACCEPTABLE, errMSG.EXSISTBUS);
          }

          const deleted_Bus = await this.busService.deleteBus(BusId);

          res.status(deleted_Bus.statuscode).json(deleted_Bus.content);
      } catch (error) {
          res.status(error.StatusCode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
      }
  }

  
  @httpPut('/update/:id?' , new Role().handler)
  async update(req: Request, res: Response) {
    try {

      const updateData: IBus = req.body as IBus;
      updateData._id = req.headers.BusID as string;

      const updated_Bus = await this.busService.updateBus(updateData);

      res.status(updated_Bus.statuscode).json(updated_Bus.Content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
    }
  }


  @httpGet('/get', new Role().handler)
  async getFilter(req: Request, res: Response) {
    try {

      const filter = {
        departure : req.query.departure,
        destination : req.query.destination,
      }
        const allBus = await this.busService.getFilteredBus(filter as Ifilter);

      res.status(allBus.statuscode).json(allBus.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT });
    }
  }

  @httpGet('/getAll', new Role().handler)
  async getAll(req: Request, res: Response) {
    try {
        const allBus = await this.busService.getAll();

      res.status(allBus.statuscode).json(allBus.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT });
    }
  }

  @httpGet('/getbyid/:id?', new Role().handler)
  async get(req: Request, res: Response) {
    try {

      const id = req.params.id;

        const Bus = await this.busService.getBusById(id);

      res.status(Bus.statuscode).json(Bus.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT });
    }
  }
}
