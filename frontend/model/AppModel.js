export default class AppModel {
    static async getFlights() {
        try {
            const flightsResponse = 
            await fetch('http://localhost:4321/flights');
            const flightsBody = await flightsResponse.json();

            if (flightsResponse.status !== 200) {
                return Promise.reject(flightsBody);
            }

            return flightsBody.flights;
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async getAirTypes() {
        try {
            const airTypesResponse = 
            await fetch('http://localhost:4321/airTypes');
            const airTypesBody = await airTypesResponse.json();

            if (airTypesResponse.status !== 200) {
                return Promise.reject(airTypesBody);
            }

            return airTypesBody.airTypes;
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async addFlight({ flightID, direction, date, airType, position = -1 } = 
        { flightID: null, direction: '', date: null, airType: null, position: -1 }) {
        try {
            const addFlightResponse = 
            await fetch('http://localhost:4321/flights',
            {
                method: 'POST',
                body: JSON.stringify({ flightID, direction, date, airType, position }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            );
            if (addFlightResponse.status !== 200) {
                const uqName = 'uq_direction_date';
                const uqErrorMsg = 'Такой рейс уже существует!';
                let addFlightBody = await addFlightResponse.json();
                if (addFlightBody.message.indexOf(uqName) !== -1) addFlightBody.message = uqErrorMsg;
                return Promise.reject(addFlightBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Рейс '${direction}' добавлен`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async addBooking({ bookingID, name, position = -1, flightID } = 
        { bookingID: null, name: '', position: -1, flightID: null }) {
        try {
            const addBookingResponse = 
            await fetch('http://localhost:4321/bookings',
            {
                method: 'POST',
                body: JSON.stringify({ bookingID, name, position, flightID }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            );
            if (addBookingResponse.status !== 200) {
                const uqName = 'uq_name';
                const uqErrorMsg = 'Человек с таким ФИО уже существует!';
                let addBookingBody = await addBookingResponse.json();
                if (addBookingBody.message.indexOf(uqName) !== -1) addBookingBody.message = uqErrorMsg;
                return Promise.reject(addBookingBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Бронь '${name}' добавлена`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async updateBooking({ bookingID, name, position = -1 } = 
        { bookingID: null, name: '', position: -1 }) {
        try {
            const updateBookingResponse = 
            await fetch(`http://localhost:4321/bookings/${bookingID}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ name, position }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            );
            if (updateBookingResponse.status !== 200) {
                const updateBookingBody = await updateBookingResponse.json();
                return Promise.reject(updateBookingBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Параметры ФИО '${name}' изменены`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async updateFlight({ flightID, direction, date, airType } = 
        { flightID: null, direction: '', date: null, airType: null }) {
        try {
            const updateFlightResponse = 
            await fetch(`http://localhost:4321/flights/${flightID}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ direction, date, airType }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            );
            if (updateFlightResponse.status !== 200) {
                const updateFlightBody = await updateFlightResponse.json();
                return Promise.reject(updateFlightBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Параметры рейса '${direction}' изменены`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async updateBookings({ reorderedTasks = [] } = 
        { reorderedTasks: [] }) {
        try {
            const updateBookingsResponse = 
            await fetch(`http://localhost:4321/bookings`,
            {
                method: 'PATCH',
                body: JSON.stringify({ reorderedTasks }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            );
            if (updateBookingsResponse.status !== 200) {
                const updateBookingsBody = await updateBookingsResponse.json();
                return Promise.reject(updateBookingsBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Порядок броней изменен`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async deleteFlight({ flightID } = 
        { flightID: null }) {
        try {
            const deleteFlightResponse = 
            await fetch(`http://localhost:4321/flights/${flightID}`,
            {
                method: 'DELETE'
            }
            );
            if (deleteFlightResponse.status !== 200) {
                const deleteFlightBody = await deleteFlightResponse.json();
                return Promise.reject(deleteFlightBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Рейс ${flightID} удален`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async deleteBooking({ bookingID } = 
        { bookingID: null }) {
        try {
            const deleteBookingResponse = 
            await fetch(`http://localhost:4321/bookings/${bookingID}`,
            {
                method: 'DELETE'
            }
            );
            if (deleteBookingResponse.status !== 200) {
                const deleteBookingBody = await deleteBookingResponse.json();
                return Promise.reject(deleteBookingBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Бронь ${bookingID} удалена`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async moveBooking({ bookingID, srcflightID, destflightID } = 
        { bookingID: null, srcflightID: null, destflightID: null }) {
        try {
            const moveBookingResponse = 
            await fetch(`http://localhost:4321/flights`,
            {
                method: 'PATCH',
                body: JSON.stringify({ bookingID, srcflightID, destflightID }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            );
            if (moveBookingResponse.status !== 200) {
                const moveBookingBody = await moveBookingResponse.json();
                return Promise.reject(moveBookingBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Бронь ${bookingID} перемещена`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }
};