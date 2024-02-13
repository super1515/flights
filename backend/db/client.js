import pg from 'pg';

export default class DB {
    #dbClient = null;
    #dbHost = '';
    #dbPort = '';
    #dbName = '';
    #dbLogin = '';
    #dbPassword = '';

    constructor(){
        this.#dbHost = process.env.DB_HOST;
        this.#dbPort = process.env.DB_PORT;
        this.#dbName = process.env.DB_NAME;
        this.#dbLogin = process.env.DB_LOGIN;
        this.#dbPassword = process.env.DB_PASSWORD;

        this.#dbClient = new pg.Client({
            user: this.#dbLogin,
            password: this.#dbPassword,
            host: this.#dbHost,
            port: this.#dbPort,
            database: this.#dbName
        });
    }

    async connect(){
        try {
            await this.#dbClient.connect();
            console.log('DB connection established');
        }catch(error){
            console.error('Unable to connect to DB: ', error);
            return Promise.reject(error);
        }
    }

    async disconnect(){
        await this.#dbClient.end();
        console.log('DB connection was closed');
    }

    async getFlights(){
        try {
            const flights = await this.#dbClient.query(
                'SELECT * FROM flights ORDER BY position;'
            );

            return flights.rows;
        }catch(error){
            console.error('Unable get flights, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async getTasks(){
        try {
            const bookings = await this.#dbClient.query(
                'SELECT * FROM bookings ORDER BY flight_id, position;'
            );

            return bookings.rows;
        }catch(error){
            console.error('Unable get bookings, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async getAirTypes(){
        try {
            const bookings = await this.#dbClient.query(
                'SELECT * FROM air_types ORDER BY capacity;'
            );

            return bookings.rows;
        }catch(error){
            console.error('Unable get air types, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async addFlight({ flightID, direction, date, airType, position = -1 } = { flightID: null,
        direction: '', date: null, airType: null, position: -1 }){
        if (!flightID || !direction || !date || !airType || position < 0){
            const errMsg = `Add flight error: wrong params`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            await this.#dbClient.query(
                'INSERT INTO flights (id, direction, date, air_types_id, position) VALUES ($1, $2, $3, $4, $5);',
                [flightID, direction, date, airType, position]
            );
        }catch(error){
            console.error('Unable add flight, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async addBooking({
        bookingID,
        name,
        position = -1,
        flightID
    } = {
        bookingID: null,
        name: '',
        position: -1,
        flightID: null
    }) {
        if (!bookingID || !name || position < 0 || !flightID){
            const errMsg = `Add booking error: wrong params`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            await this.#dbClient.query(
                'INSERT INTO bookings (id, name, position, flight_id) VALUES ($1, $2, $3, $4);',
                [bookingID, name, position, flightID]
            );
            
            await this.#dbClient.query(
                'UPDATE flights SET bookings = array_append(bookings, $1) WHERE id = $2;',
                [bookingID, flightID]
            );
        }catch(error){
            console.error('Unable add booking, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async updateBooking({
        bookingID,
        name,
        position = -1
    } = {
        bookingID: null,
        name: '',
        position: -1
    }) {
        if (!bookingID || (!name && position < 0)){
            const errMsg = `Update booking error: wrong params`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        let query = null;
        const queryParams = [];
        if (name && position >= 0){
            query = 'UPDATE bookings SET name = $1, position = $2 WHERE id = $3;';
            queryParams.push(name, position, bookingID);
        } else if (name){
            query = 'UPDATE bookings SET name = $1 WHERE id = $2;';
            queryParams.push(name, bookingID);
        } else {
            query = 'UPDATE bookings SET position = $1 WHERE id = $2;';
            queryParams.push(position, bookingID);
        }

        try {
            await this.#dbClient.query(query, queryParams);
        }catch(error){
            console.error('Unable update booking, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async updateFlight({
        flightID, direction, date, airType
    } = {
        flightID: null, direction: '', date: null, airType: null
    }) {
        if (!flightID || !direction || !date || !airType){
            const errMsg = `Update flight error: wrong params`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        let query = null;
        const queryParams = [];
        query = 'UPDATE flights SET direction = $1, date = $2, air_types_id = $3 WHERE id = $4;';
        queryParams.push(direction, date, airType, flightID);

        try {
            await this.#dbClient.query(query, queryParams);
        }catch(error){
            console.error('Unable update booking, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async deleteFlight({ flightID } = {flightID: null}){
        if (!flightID){
            const errMsg = `Delete flight error: wrong params`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }
        try {
            await this.#dbClient.query(
                'DELETE FROM bookings WHERE flight_id = $1;',
                [flightID]
            );
            await this.#dbClient.query(
                'DELETE FROM flights WHERE id = $1;',
                [flightID]
            );
        }catch(error){
            console.error('Unable delete flight, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async deleteBooking({ bookingID } = {bookingID: null}){
        if (!bookingID){
            const errMsg = `Delete booking error: wrong params`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }
        try {
            const queryResult = await this.#dbClient.query(
                'SELECT flight_id FROM bookings WHERE id = $1;',
                [bookingID]
            );

            const { flight_id: flightID } = queryResult.rows[0];

            await this.#dbClient.query(
                'DELETE FROM bookings WHERE id = $1;',
                [bookingID]
            );

            await this.#dbClient.query(
                'UPDATE flights SET bookings = array_remove(bookings, $1) WHERE id = $2;',
                [bookingID, flightID]
            );
        }catch(error){
            console.error('Unable delete booking, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async moveBooking(
        { 
            bookingID, 
            srcflightID, 
            destflightID 
        } = {
            bookingID: null, 
            srcflightID: null, 
            destflightID: null
        }) {
        if (!bookingID || !srcflightID || !destflightID){
            const errMsg = `Move booking error: wrong params`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }
        try {
            await this.#dbClient.query(
                'UPDATE bookings SET flight_id = $1 WHERE id = $2;',
                [destflightID, bookingID]
            );

            await this.#dbClient.query(
                'UPDATE flights SET bookings = array_append(bookings, $1) WHERE id = $2;',
                [bookingID, destflightID]
            );

            await this.#dbClient.query(
                'UPDATE flights SET bookings = array_remove(bookings, $1) WHERE id = $2;',
                [bookingID, srcflightID]
            );
        }catch(error){
            console.error('Unable move booking, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }
};