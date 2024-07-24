import { injectable } from "inversify";
import { errMSG } from "../Constant/message";

@injectable()
export class ApiError extends Error {
   statuscode: number;

   constructor(
      StatusCode: number,
      message = `${errMSG.DEFAULTERRORMSG}`,

   ) {
      super(message);
      this.statuscode = StatusCode;
      this.message = message;
   }

}