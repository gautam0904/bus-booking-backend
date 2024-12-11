import 'reflect-metadata';
import express from 'express'
import dotenv from 'dotenv';
import { InversifyExpressServer } from 'inversify-express-utils';
import cors from 'cors';
import container from './inversify.config'
import { connectDB } from './DB/index';
import { errMSG, MSG } from './Constant/message'

dotenv.config();

const server = new InversifyExpressServer(container)

server.setConfig((app: express.Application) => {
    app.use(express.json());
    app.use(express.static('public'));
     const allowedOrigin = process.env.NODE_ENV === 'production' 
        ? 'https://your-deployed-frontend-url.com' 
        : 'http://localhost:4200'; 
    app.use(cors({
        origin: allowedOrigin,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type'],
        credentials: true
    }));
});

const app = server.build();

connectDB().then(() => {
    app.listen((process.env.PORT || 3135 ), () => {
        console.log(MSG.SERVERLISTEN, process.env.port)
    })
}).catch((e) => {
    console.log(errMSG.CONNECTDB, e)
})
