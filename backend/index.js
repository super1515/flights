import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import DB from './db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: './backend/.env'
});

const appHost = process.env.APP_HOST;
const appPort = process.env.APP_PORT;

const app = express();
const db = new DB();

app.use('*', (req, res, next) => {
    console.log(
        req.method,
        req.baseUrl || req.url,
        new Date().toISOString()    
    );
    next();
});

// middleware for static app files
app.use('/', express.static(path.resolve(__dirname, '../dist')));

// get flights and bookings
app.get('/flights', async (req, res) => {
    try {
        const [dbflights, dbTasks] = await Promise.all([db.getFlights(), db.getTasks()]);
        const bookings = dbTasks.map(({ id, name, position })=>({
            bookingID: id, name, position
        }));
        const flights = dbflights.map(flight => ({
            flightID: flight.id,
            direction: flight.direction,
            date: flight.date,
            airType: flight.air_types_id,
            position: flight.position,
            bookings: bookings.filter(booking => flight.bookings.indexOf(booking.bookingID) !== -1)
        }));

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json({ flights });
    } catch(err){
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting flights and bookings error: ${err.error.message || err.error}`
        });
    }
});

app.get('/airTypes', async (req, res) => {
    try {
        const dbAirTypes = await db.getAirTypes();
        const airTypes = dbAirTypes.map(({ id, name, capacity })=>({
            id, name, capacity
        }));

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json({ airTypes });
    } catch(err){
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting air types error: ${err.error.message || err.error}`
        });
    }
});

// body parsing middleware
app.use('/flights', express.json());
// add flight
app.post('/flights', async (req, res) => {
    try {
        const { flightID, direction, date, airType, position } = req.body;
        await db.addFlight({ flightID, direction, date, airType, position });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch(err){
        switch (err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
            }
        res.json({
            timestamp: (new Date).toISOString(),
            statusCode: res.statusCode,
            message: `Add flights error: ${err.error.message || err.error}`
        });
    }
});

app.use('/bookings', express.json());
// add bookings
app.post('/bookings', async (req, res) => {
    try {
        const { bookingID, name, position, flightID } = req.body;
        await db.addBooking({ bookingID, name, position, flightID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch(err){
        switch (err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
            }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add booking error: ${err.error.message || err.error}`
        });
    }
});

// body parsing middleware
app.use('/bookings:bookingID', express.json());
// edit booking params
app.patch('/bookings/:bookingID', async (req, res)=>{
    try {
        const { bookingID } = req.params;
        const { name, position } = req.body;
        await db.updateBooking({ bookingID, name, position });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch(err){
        switch (err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
            }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update booking error: ${err.error.message || err.error}`
        });
    }
});

app.use('/flights:flightsID', express.json());
// edit flights params
app.patch('/flights/:flightID', async (req, res)=>{
    try {
        const { flightID } = req.params;
        const { direction, date, airType } = req.body;
        await db.updateFlight({ flightID, direction, date, airType });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch(err){
        switch (err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
            }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update flight error: ${err.error.message || err.error}`
        });
    }
});

// edit saveral bookings position
app.patch('/bookings', async (req, res) => {
    try {
        const { reorderedTasks } = req.body;

        await Promise.all(
            reorderedTasks.map(({ bookingID, position }) => 
        db.updateBooking({ bookingID, position }))
        );

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch(err){
        switch (err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
            }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update bookings error: ${err.error.message || err.error}`
        });
    }
});

// edit booking
app.delete('/bookings/:bookingID', async (req, res) => {
    try {
        const { bookingID } = req.params;
        await db.deleteBooking({ bookingID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch(err){
        switch (err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
            }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Delete bookings error: ${err.error.message || err.error}`
        });
    }
});

app.delete('/flights/:flightID', async (req, res) => {
    try {
        const { flightID } = req.params;
        await db.deleteFlight({ flightID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch(err){
        switch (err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
            }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Delete flights error: ${err.error.message || err.error}`
        });
    }
});

// move booking between flights
app.patch('/flights', async (req, res)=>{
    try {
        const { bookingID, srcflightID, destflightID } = req.body;
        console.log({ bookingID, srcflightID, destflightID });
        await db.moveBooking({ bookingID, srcflightID, destflightID });
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
    } catch(err){
        switch (err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
            }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Move bookings error: ${err.error.message || err.error}`
        });
    }
});

const server = app.listen(Number(appPort), appHost, async () => {
    try{
        await db.connect();
    }catch(error){
        console.log('Booking manager app down');
        process.exit(100);
    }

    console.log(`started ${appHost}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        await db.disconnect();
        console.log('HTTP server closed');
    });
});