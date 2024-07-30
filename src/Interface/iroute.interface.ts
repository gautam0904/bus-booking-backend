export interface Iroute {
    _id : string;
    routeName: string;
    stations: [{
        station: string;
        order: number;
        distanceFromStart: number;
    }];
}