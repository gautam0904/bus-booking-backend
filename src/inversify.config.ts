import { Container } from 'inversify';
import { Types } from './Types/types';
import * as service from './Service';
import * as controller from './Controller';
import { Auth } from './Middleware/auth.middleware';
import { Role } from './Middleware/role.middleware';

const container = new Container();
// Bind controllers

for (const i in controller) {
    const Controller = (controller as { [key: string]: any })[i];
    container.bind<typeof Controller>(Types[Controller.name as keyof typeof Types]).to(Controller);
}

// Bind services

for (const i in service) {
    const Service = (service as { [key: string]: any})[i];
    container.bind<typeof Service>(Types[Service.name as keyof typeof Types]).to(Service);
}

// Bind middleware
container.bind<Auth>(Types.Auth).to(Auth);
container.bind<Role>(Types.Role).to(Role);

export default container;
