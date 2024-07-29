export interface Iroute {
    _id : string;
    routeName: string;
    stations: [{
        previousStation: string;
        currentStation: string;
        distance: number;
    }];
}