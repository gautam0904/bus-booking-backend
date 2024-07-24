import { BookedService } from './Service/booked.service';
import { BookController } from './Controller/booked.controller';
import { Container } from 'inversify';
import { Types } from './Types/types';
import * as service from './Service';
import * as controller from './Controller';
import { Auth } from './Middleware/auth.middleware';
import { Role } from './Middleware/role.middleware';

const container = new Container();

// controlle

container.bind<controller.UserController>(Types.UserController).to(controller.UserController);
container.bind<controller.BusController>(Types.BusController).to(controller.BusController);
container.bind<controller.BookController>(Types.BookedController).to(controller.BookController);

// services 
container.bind<service.UserService>(Types.UserService).to(service.UserService);
container.bind<service.BusService>(Types.BusService).to(service.BusService);
container.bind<service.BookedService>(Types.BookedService).to(service.BookedService);

//middleware
container.bind<Auth>(Types.Auth).to(Auth)
container.bind<Role>(Types.Role).to(Role)

export default container;