import { BookedService } from '../Service/booked.service';
import { controller, httpDelete, httpGet, httpPost, httpPut } from "inversify-express-utils";
import { inject } from "inversify";
import { Types } from "../Types/types";
import { Request, Response } from "express";
import { StatusCode } from "../Constant/statuscode";
import { errMSG } from "../Constant/message";
import { ApiError } from "../Utils/ApiError";
import { Auth } from "../Middleware/auth.middleware";
import { Role } from "../Middleware/role.middleware";
import { Ifilter } from "../Interface/ifilter.interface";
import { IbookedSeat } from '../Interface/ibookedSeat.interface';

@controller('/bus', new Auth().handler)

export class BookedController {
  private bookingService: BookedService;

  constructor(@inject(Types.BookedService) bookServices: BookedService) {
    this.bookingService = bookServices;

  }

  @httpPost('/book', new Role().handler)
  async create(req: Request, res: Response) {
    try {

      const userID = req.headers.USERID;
      if (!userID) {
        throw new ApiError(StatusCode.NOTACCEPTABLE, errMSG.EXSISTUSER);
      }
      const seatData: IbookedSeat = req.body as IbookedSeat;

      const created_ticket = await this.bookingService.booking(seatData, userID as string);

      res.status(created_ticket.statusCode).json(created_ticket.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
    }
  }



  @httpPost('/bookedSeat/', new Role().handler)
  async getAll(req: Request, res: Response) {
    try {

      const filter = req.body

      const bookedseat = await this.bookingService.availableSeat(filter as Ifilter, filter.busId);

      res.status(bookedseat.statusCode).json(bookedseat.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT });
    }
  }
}
