import AirType from './AirType';
import Flight from './Flight';
import AppModel from '../model/AppModel';

export default class App {
    #flights = [];
    #airTypes = [];

    onEscapeKeydown = (event) => {
        if (event.key === 'Escape'){
            const input = document.querySelector('.flight-adder__input');
            input.style.display = 'none';
            input.value = '';

            document.querySelector('.flight-adder__btn')
                .style.display = 'inherit';
        }
    };

    onInputKeydown = async (event) => {
        if (event.key !== 'Enter') return;
        const direction = document.querySelector('.flight-adder__input_direction');
        const date = document.querySelector('.flight-adder__input_date');
        const airType = document.querySelector('.flight-adder__input_air-type');
        console.log(direction.value);
        console.log(date.value);
        console.log(airType[airType.selectedIndex].id);
        if (event.target.value) {
            const flightID = crypto.randomUUID();

            try {
                const addflightResult = await AppModel.addFlight({
                    flightID,
                    direction: direction.value,
                    date: date.value,
                    airType: airType[airType.selectedIndex].id,
                    position: this.#flights.length
                });
                console.log(event.target);
                const newflight = new Flight({
                    flightID,
                    direction: direction.value,
                    date: date.value,
                    airType: this.#airTypes.find(i => i.airTypeID === airType[airType.selectedIndex].id),
                    position: this.#flights.length,
                    onDropTaskInflight: this.onDropTaskInflight,
                    addNotification: this.addNotifications
                });

                this.#flights.push(newflight);
                newflight.render();
                this.addNotifications({text: addflightResult.message, type: 'success'});
            } catch (err){
                this.addNotifications({text: err.message, type: 'error'});
            }
        }

        document.querySelector('.flight-adder__input')
                .style.display = 'none';
        event.target.value = '';

        document.querySelector('.flight-adder__btn')
            .style.display = 'inherit';
    };

    onDropTaskInflight = async (evt) => {
        evt.stopPropagation();

        const destflightElement = evt.currentTarget;
        destflightElement.classList.remove('flight_droppable');
        destflightElement.classList.remove('flight_undroppable');
        
        const movedbookingID = localStorage.getItem('movedbookingID');
        const srcflightID = localStorage.getItem('srcflightID');
        const destflightID = destflightElement.getAttribute('id');
        
        localStorage.setItem('movedbookingID', '');
        localStorage.setItem('srcflightID', '');
        if (!destflightElement.querySelector(`[id="${movedbookingID}"]`)) return;
        if (destflightElement.matches('.flight_undroppable')) return;
        const srcflight = this.#flights.find(flight => flight.flightID === srcflightID);
        const destflight = this.#flights.find(flight => flight.flightID === destflightID);
        try {
        if (srcflightID !== destflightID) {
            await AppModel.moveBooking({
                bookingID:movedbookingID,
                srcflightID,
                destflightID
            });

            const movedTask = srcflight.deleteBooking({ 
                bookingID: movedbookingID 
            });
            destflight.pushTask({ booking: movedTask });

            await srcflight.reorderTasks();
        }

            await destflight.reorderTasks();

            console.log(`Задача '${movedbookingID}' перемещена`);
            this.addNotifications({text: `Задача '${movedbookingID}' перемещена`, type: 'success'});
        } catch(err){
            this.addNotifications({text: err.message, type: 'error'});
            console.error(err);
        }
    };
    editFlight = async ({ flightID, newFlightDirection, newFlightDate, newFlightAirType }) => {
        let fFlight = this.#flights.find(i => i.flightID === flightID);

        const curDirection = fFlight.flightDirection;
        const curDate = fFlight.flightDate;
        const airType = this.#airTypes.find(i => i.airTypeID === newFlightAirType);
        if (!newFlightDirection || !newFlightDate || !newFlightAirType || 
            (newFlightDirection === curDirection && newFlightDate === curDate)) return;

        try {
            const updateFlightResult = await AppModel.updateFlight({ 
                flightID, 
                direction: newFlightDirection, 
                date: newFlightDate,
                airType: newFlightAirType
            });

            fFlight.flightDirection = newFlightDirection;
            fFlight.flightDate = newFlightDate;
            fFlight.flightAirType = newFlightAirType;
            document.querySelector(`[id="${flightID}"] .flight__name`).innerHTML = newFlightDirection;
            document.querySelector(`[id="${flightID}"] .flight__air-type`).innerHTML = airType.airTypeName + ` [${airType.airTypeCapacity}]`;
            document.querySelector(`[id="${flightID}"] .flight__date`).innerHTML = new Date(Date.parse(newFlightDate)).toLocaleString("ru");
            
            this.addNotifications({text: updateFlightResult.message, type: 'success'});
        } catch (err){
            this.addNotifications({text: err.message, type: 'error'});
            console.error(err);
        }
    };
    deleteFlight = async ({ flightID }) => {
        let fFlight = this.#flights.find(i => i.flightID === flightID);

        try{
            const deleteFlightResult = await AppModel.deleteFlight({ flightID });
            console.log(this.#flights);
            console.log(fFlight.flightID);
            this.#flights.splice(this.#flights.findIndex(i => i.flightID === fFlight.flightID), 1);
            console.log(this.#flights);
            document.getElementById(fFlight.flightID).remove();

            console.log(deleteFlightResult);
            this.addNotifications({text: deleteFlightResult.message, type: 'success'});
        }catch (err){
            this.addNotifications({text: err.message, type: 'error'});
            console.error(err);
        }
    };
    editBooking = async ({ bookingID, newbookingName }) => {
        let fTask = null;
        for (let flight of this.#flights) {
            fTask = flight.getTaskByID({ bookingID });
            if (fTask) break;
        }

        const curbookingName = fTask.bookingName;

        if (!newbookingName || newbookingName === curbookingName) return;

        try {
            const updateBookingResult = await AppModel.updateBooking({ bookingID, name: newbookingName });

            fTask.bookingName = newbookingName;
            document.querySelector(`[id="${bookingID}"] span.task__text`).innerHTML = newbookingName;
            
            this.addNotifications({text: updateBookingResult.message, type: 'success'});
        } catch (err){
            this.addNotifications({text: err.message, type: 'error'});
            console.error(err);
        }
    };
    deleteBooking = async ({ bookingID }) => {
        let fTask = null;
        let fflight = null;
        for (let flight of this.#flights) {
            fflight = flight;
            fTask = flight.getTaskByID({ bookingID });
            if (fTask) break;
        }

        try{
            const deleteBookingResult = await AppModel.deleteBooking({ bookingID });

            fflight.deleteBooking({bookingID});
            document.getElementById(bookingID).remove();

            console.log(deleteBookingResult);
            this.addNotifications({text: deleteBookingResult.message, type: 'success'});
        }catch (err){
            this.addNotifications({text: err.message, type: 'error'});
            console.error(err);
        }
    };

    initaddBookingModal() {
        const addBookingModal = document.getElementById('modal-add-booking');

        const cancelHandler = () => {
            addBookingModal.close();
            localStorage.setItem('addBookingflightID', '');
            addBookingModal.querySelector('.app-modal__input').value = '';
        };

        const okHandler = () => {
            const flightID = localStorage.getItem('addBookingflightID');
            const modalInput = addBookingModal.querySelector('.app-modal__input');

            if (flightID && modalInput.value){
                this.#flights.find(flight => flight.flightID === flightID)
                    .appendNewTask({ name: modalInput.value });
            }

            cancelHandler();
        };

        addBookingModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
        addBookingModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
        addBookingModal.addEventListener('close', cancelHandler);
    };

    initEditBookingModal() {
        const editBookingModal = document.getElementById('modal-edit-booking');

        const cancelHandler = () => {
            editBookingModal.close();
            localStorage.setItem('editbookingID', '');
            editBookingModal.querySelector('.app-modal__input').value = '';
        };

        const okHandler = () => {
            const bookingID = localStorage.getItem('editbookingID');
            const modalInput = editBookingModal.querySelector('.app-modal__input');

            if (bookingID && modalInput.value){
                this.editBooking({ bookingID, newbookingName: modalInput.value });
            }

            cancelHandler();
        };

        editBookingModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
        editBookingModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
        editBookingModal.addEventListener('close', cancelHandler);
    };

    initEditFlightModal() {
        const editFlightModal = document.getElementById('modal-edit-flight');
        const modalDirection = editFlightModal.querySelector('.app-modal__direction');
        const modalDate = editFlightModal.querySelector('.app-modal__date');
        const modalAirType = editFlightModal.querySelector('.app-modal__date__air-type');
        const airTypeElement = document.getElementById('modal-airType');
        airTypeElement.innerHTML = '';
        for (const type of this.#airTypes){
            const airType = document.createElement('option');
            airType.id = type.airTypeID;
            airType.innerHTML = `${type.airTypeName} [${type.airTypeCapacity}]`;
            airTypeElement.appendChild(airType);
        }
        const cancelHandler = () => {
            editFlightModal.close();
            localStorage.setItem('editFlightID', '');
            modalDirection.value = '';
            modalDate.value = '';
            modalAirType.selectedIndex = 0;
        };

        const okHandler = () => {
            const flightID = localStorage.getItem('editFlightID');

            if (flightID && modalDirection.value && modalDate.value && modalAirType[modalAirType.selectedIndex].id){
                this.editFlight({ 
                    flightID, 
                    newFlightDirection: modalDirection.value, 
                    newFlightDate:modalDate.value, 
                    newFlightAirType:modalAirType[modalAirType.selectedIndex].id 
                });
            }

            cancelHandler();
        };

        editFlightModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
        editFlightModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
        editFlightModal.addEventListener('close', cancelHandler);
    };

    initDeleteFlightModal() {
        const deleteFlightModal = document.getElementById('modal-delete-flight');

        const cancelHandler = () => {
            deleteFlightModal.close();
            localStorage.setItem('deleteFlightID', '');
        };

        const okHandler = () => {
            const flightID = localStorage.getItem('deleteFlightID');
            
            if (flightID){
                this.deleteFlight({ flightID });
            }

            cancelHandler();
        };

        deleteFlightModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
        deleteFlightModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
        deleteFlightModal.addEventListener('close', cancelHandler);
    };

    initdeleteBookingModal() {
        const deleteBookingModal = document.getElementById('modal-delete-booking');

        const cancelHandler = () => {
            deleteBookingModal.close();
            localStorage.setItem('deletebookingID', '');
        };

        const okHandler = () => {
            const bookingID = localStorage.getItem('deletebookingID');
            
            if (bookingID){
                this.deleteBooking({ bookingID });
            }

            cancelHandler();
        };

        deleteBookingModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
        deleteBookingModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
        deleteBookingModal.addEventListener('close', cancelHandler);
    };

    initNotifications() {
        const notifications = document.getElementById('app-notifications');
        notifications.show();
    }

    addNotifications = ({ text, type}) => {
        const notifications = document.getElementById('app-notifications');

        const notificationID = crypto.randomUUID();
        const notification = document.createElement('div');
        notification.classList.add(
            'notification',
            type === 'success' ? 'notification-success' : 'notification-error'
        );
        notification.setAttribute('id', notificationID);
        notification.innerHTML = text;

        notifications.appendChild(notification);

        setTimeout(() => {document.getElementById(notificationID).remove(); }, 5000);
    };

    async init() {
        const airTypes = await AppModel.getAirTypes();
        for (const type of airTypes){
            const airTypeObj = new AirType({
                airTypeID: type.id,
                name: type.name,
                capacity: type.capacity
            });
            this.#airTypes.push(airTypeObj);
        }
        
        console.log(airTypes);
        document.querySelector('.flight-adder__btn')
            .addEventListener('click', (event) => {
                event.target.style.display = 'none';

                const input = document.querySelector('.flight-adder__input');
                const airTypeElement = document.getElementById('airType');
                airTypeElement.innerHTML = '';
                for (const type of this.#airTypes){
                    const airType = document.createElement('option');
                    airType.id = type.airTypeID;
                    airType.innerHTML = `${type.airTypeName} [${type.airTypeCapacity}]`;
                    airTypeElement.appendChild(airType);
                }
                input.style.display = 'inherit';
                input.focus();
            });

        document.addEventListener('keydown', this.onEscapeKeydown);

        document.querySelector('.flight-adder__input')
            .addEventListener('keydown', this.onInputKeydown);

        document.getElementById('theme-switch')
            .addEventListener('change', (evt) => {
                (evt.target.checked
                    ? document.body.classList.add('dark-theme')
                    : document.body.classList.remove('dark-theme'));
            });

        this.initaddBookingModal();
        this.initEditBookingModal();
        this.initdeleteBookingModal();
        this.initEditFlightModal();
        this.initDeleteFlightModal();
        this.initNotifications();
        document.addEventListener('dragover', (evt) => {
            evt.preventDefault();

            const draggedElement = document.querySelector('.booking.booking_selected');
            const srcflightID = localStorage.getItem('srcflightID');
            const currentElement = evt.target;
            const prevDroppable = document.querySelector('.flight_droppable');
            const prevUnDroppable = document.querySelector('.flight_undroppable');
            let curDroppable = evt.target;
            while (!curDroppable.matches('.flight') && curDroppable !== document.body) {
                curDroppable = curDroppable.parentElement;
            }
            if (curDroppable !== prevDroppable || curDroppable !== prevUnDroppable) {
                if (prevDroppable) prevDroppable.classList.remove('flight_droppable');
                if (prevUnDroppable) prevUnDroppable.classList.remove('flight_undroppable');
                
                if (curDroppable.matches('.flight')) {
                    const curflight = this.#flights.find(i => i.flightID === curDroppable.getAttribute('id'));
                    if (curDroppable.getAttribute('id') === srcflightID || 
                    curflight.flightAirType.airTypeCapacity < curflight.bookingsCount + 1) 
                        curDroppable.classList.add('flight_undroppable');
                    else
                        curDroppable.classList.add('flight_droppable');
                }
            }

            if (!curDroppable.matches('.flight') || draggedElement === currentElement) return;

            if (curDroppable.matches('.flight_droppable')) curDroppable.querySelector('.flight__bookings-list')
                .appendChild(draggedElement);
        });

        try {
            const flights = await AppModel.getFlights();
            for (const flight of flights) {
                const flightObj = new Flight({
                    flightID: flight.flightID,
                    direction: flight.direction,
                    date: flight.date,
                    airType: this.#airTypes.find(airType => airType.airTypeID === flight.airType),
                    position: flight.position,
                    onDropTaskInflight: this.onDropTaskInflight,
                    addNotification: this.addNotifications
                });
                this.#flights.push(flightObj);
                flightObj.render();

                for (const booking of flight.bookings) {
                    flightObj.addNewTaskLocal({
                        bookingID: booking.bookingID,
                        name: booking.name,
                        position: booking.position
                    });
                }
            }
        } catch(err) {
            this.addNotifications({text: err.message, type: 'error'});
            console.error(err);
        }
    }
};