export const Types = {
	// User
	UserService: Symbol.for('UserServices'),
	UserController: Symbol.for('UserController'),

    // bus
	BusService: Symbol.for('BusService'),
	BusController: Symbol.for('BusController'),

	// booked
	BookedService: Symbol.for('BookedService'),
	BookedController: Symbol.for('BookedController'),

	// route
	RouteService : Symbol.for('RouteService'),
	RouteController : Symbol.for('RouteController'),

	// station
	StationService : Symbol.for('StationService'),
	StationController : Symbol.for('StationController'),

	//middleware
	Auth: Symbol.for('Auth'),
	Role: Symbol.for('Role')
}

