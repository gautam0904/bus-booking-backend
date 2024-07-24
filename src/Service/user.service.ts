import { injectable } from "inversify";
import { Iuser } from "../Interface/iuser.interface";
import User from "../Model/user.model";
import { ApiError } from "../Utils/ApiError";
import { StatusCode } from "../Constant/statuscode";
import { errMSG, MSG } from "../Constant/message";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

@injectable()
export class UserService {

    constructor() {
    }

    async createUser(userData: Iuser) {
        try {
            const existuser = await User.findOne({ email: userData.email });

            if (existuser) {
                throw new ApiError(StatusCode.CONFLICT, errMSG.EXSISTUSER)
            }

            const result = await User.create({
                name: userData.name,
                email: userData.email,
                password: userData.password,
            });
            return {
                statusCode: StatusCode.OK,
                content: {
                    message: MSG.USERCREATED,
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
    async loginUser(userData: Iuser) {
        try {
            const existUser = await User.findOne({
                email: userData.email
            });

            if (!existUser) {
                throw new ApiError(StatusCode.NOTFOUND, errMSG.NOTEXISTUSER)
            }


            const isMatch = await bcrypt.compare(userData.password, existUser.password);

            if (!isMatch) {
                throw new ApiError(StatusCode.NOTACCEPTABLE, errMSG.PASSWORDNOTMATCH)
            }

            const token = jwt.sign(
                {
                    id: existUser._id,
                    role: existUser.role
                },
                process.env.AccessTokenSeceret as string,
                {
                    expiresIn: process.env.AccessExpire
                });

            return {
                statuscode: StatusCode.OK,
                Content: {
                    message: MSG.SUCCESS('User logged in'),
                    data: {
                        token: token,
                        user: existUser
                    }
                }

            }
        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.INTERNALSERVERERROR,
                Content: {
                    message: error.message || errMSG.DEFAULTERRORMSG,
                }
            }
        }
    }

      async deleteUser(userId: string , userOwnId: string) {
        const session = await mongoose.startSession();

        session.startTransaction();

        try {
          const opts = { session };


          const existUser = await User.findOne({ _id: userId });
          if (!existUser) {
            throw new ApiError(StatusCode.NOTFOUND, errMSG.NOTEXISTUSER);
          }

          if (userId === userOwnId) {
            throw new ApiError(StatusCode.CONFLICT , errMSG.USEROWNDELETE)
          }

          const deletedUser = await User.findOneAndDelete({ _id: userId },opts);

          await session.commitTransaction();

          return {
            statuscode: StatusCode.OK,
            content: {
              message: MSG.SUCCESS('user is deleted'),
              data: deletedUser
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

    async getUserById(userId: string) {
        try {
            const user = await User.findById(userId)
            if (!user) throw new ApiError(StatusCode.NOCONTENT, errMSG.USERNOTFOUND)

            return user


        } catch (error) {
            return {
                message: error.message || errMSG.DEFAULTERRORMSG,
            }
        }
    }

    async getAlluser() {
        try {
            const users = await User.aggregate([
                {
                    $match: {},
                },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        usertype: 1,
                        createdAt: 1,
                        profilePicture: 1,
                        _id: 1
                    },
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                }
            ]);
            if (users) {
                return {
                    statuscode: StatusCode.OK,
                    content: {
                        message: MSG.SUCCESS('Users get '),
                        data: users
                    },
                };
            } else {
                throw new ApiError(StatusCode.NOTFOUND, `${errMSG.USERNOTFOUND}`);
            }
        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                content: { message: error.message },
            };
        }
    }

     async updateUser(updateData: Iuser ,userOwnId: string ) {
        try {

            const existUser = await User.findById(updateData._id);

            if (!existUser) {
                throw new ApiError(StatusCode.NOTFOUND, errMSG.USERNOTFOUND);
            }

            if (userOwnId === updateData._id) {
                throw new ApiError(StatusCode.CONFLICT , errMSG.USEROWNUPDATE)
            }

            const result = await User.findByIdAndUpdate(
                {
                    _id: updateData._id,
                },
                {
                    $set: {
                        name: updateData.name,
                        email: updateData.email,
                    },
                },
                { new: true }
            );
            if (result) {
                return {
                    statuscode: StatusCode.OK,
                    Content: result,
                };
            }
            throw new ApiError(StatusCode.NOTIMPLEMENTED, errMSG.UPDATEUSER);
        } catch (error) {
            return {
                statuscode: error.statusCode || StatusCode.NOTIMPLEMENTED,
                Content: error.message,
            };
        }
    }


}