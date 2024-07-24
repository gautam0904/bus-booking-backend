import { controller, httpDelete, httpGet, httpPost, httpPut } from "inversify-express-utils";
import { UserService } from "../Service";
import { inject } from "inversify";
import { Types } from "../Types/types";
import { Iuser } from "../Interface/iuser.interface";
import { Request, Response } from "express";
import { StatusCode } from "../Constant/statuscode";
import { errMSG } from "../Constant/message";
import { ApiError } from "../Utils/ApiError";
import { Auth } from "../Middleware/auth.middleware";
import { Role } from "../Middleware/role.middleware";

@controller('/user')

export class UserController {
  private userService: UserService;

  constructor(@inject(Types.UserService) userServices: UserService) {
    this.userService = userServices;

  }

  @httpPost('/signup')
  async signup(req: Request, res: Response) {
    try {

      const signupData: Iuser = req.body as unknown as Iuser;

      const created_user = await this.userService.createUser(signupData);

      res.status(created_user.statusCode).json(created_user.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
    }
  }

  @httpPost('/login')
  async login(req: Request, res: Response) {
    try {
      const loginData: Iuser = req.body as unknown as Iuser;

      if ([loginData.email, loginData.password].some((field) => field.trim() == "")) {
        throw new ApiError(StatusCode.NOTACCEPTABLE, errMSG.EXSISTUSER);
      }

      const login_user = await this.userService.loginUser(loginData);

      res.status(login_user.statuscode).json(login_user.Content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
    }

  }

  @httpPost('/validToken')
  async validToken(req: Request, res: Response) {
    try {
      const token = req.body

    } catch (error) {
      
    }
  }

  @httpDelete('/delete/:id?')
  async delete(req: Request, res: Response) {
      try {
          const userId = req.params.id;
          const userOwnId : string = req.headers.USERID as string;
          if (!userId) {
              throw new ApiError(StatusCode.NOTACCEPTABLE, errMSG.EXSISTUSER);
          }

          const deleted_user = await this.userService.deleteUser(userId , userOwnId);

          res.status(deleted_user.statuscode).json(deleted_user.content);
      } catch (error) {
          res.status(error.StatusCode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
      }
  }

  
  @httpPut('/update/:id?', new Auth().handler, new Role().handler)
  async update(req: Request, res: Response) {
    try {

      const updateData: Iuser = req.body as Iuser;
      updateData._id = req.headers.USERID as string;

      const userId = req.headers.USERID as string;

      const updated_user = await this.userService.updateUser(updateData , userId);

      res.status(updated_user.statuscode).json(updated_user.Content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT })
    }
  }

  @httpGet('/getAll', new Auth().handler)
  async getAll(req: Request, res: Response) {
    try {
      const allUsers = await this.userService.getAlluser();

      res.status(allUsers.statuscode).json(allUsers.content);
    } catch (error) {
      res.status(error.statuscode || StatusCode.NOTIMPLEMENTED).json({ message: error.message || errMSG.INTERNALSERVERERRORRESULT });
    }
  }
}
