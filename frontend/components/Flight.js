import AirType from './AirType';
import AppModel from '../model/AppModel';
import Booking from './Booking'

export default class Flight {
    #bookings = [];
    #direction = '';
    #date = null;
    #airType = null;
    #flightID = null;
    #flightPosition = -1
    constructor({
        flightID = null,
        direction,
        date,
        airType,
        position,
        onDropTaskInflight,
        addNotification
    }){
        this.#direction = direction;
        this.#date = date;
        this.#airType = airType;
        this.#flightID = flightID || crypto.randomUUID();
        this.#flightPosition = position;
        this.onDropTaskInflight = onDropTaskInflight;
        this.addNotification = addNotification;
    }

    get flightID() { return this.#flightID; }
    get flightDirection() { return this.#direction; }
    set flightDirection(value) {
        if (typeof value === 'string') {
            this.#direction = value;
        }
    }
    get flightDate() { return this.#date; }
    set flightDate(value) {
        this.#date = value;
    }
    get flightAirType() { return this.#airType; }
    set flightAirType(value) {
        this.#airType = value;
    }
    get bookingsCount() { return this.#bookings.length; }
    get flightPosition() { return this.#flightPosition; }
    pushTask = ({ booking }) => this.#bookings.push(booking);
    getTaskByID = ({ bookingID }) => this.#bookings.find(booking => booking.bookingID === bookingID);
    deleteBooking = ({ bookingID }) => {
        const deleteBookingIndex = this.#bookings.findIndex(booking => booking.bookingID === bookingID);
        if(deleteBookingIndex === -1) return;

        const [deletedTask] = this.#bookings.splice(deleteBookingIndex, 1);
        //this.reorderTasks();

        return deletedTask;
    };

    reorderTasks = async () => {
        const orderedTasksIDs = Array.from(
            document.querySelector(`[id="${this.#flightID}"] .flight__bookings-list`).children,
            elem => elem.getAttribute('id')
        );
        
        const reorderedTasksInfo = [];

        orderedTasksIDs.forEach((bookingID, position) => {
            const booking = this.#bookings.find(booking => booking.bookingID === bookingID);
            console.log(booking);
            if(booking.taskPosition !== position) {
                booking.taskPosition = position;
                reorderedTasksInfo.push({ bookingID, position });
            }
        });

        if (reorderedTasksInfo.length > 0){
            try {
                await AppModel.updateBookings({ reorderedTasks: reorderedTasksInfo });
            } catch(err){
                this.addNotification({text: err.message, type: 'error'});
                console.error(err);
            }
        }
    };

    appendNewTask = async ({ name }) => {
        try {
            const bookingID = crypto.randomUUID();
            const addBookingResult = await AppModel.addBooking({
                bookingID,
                name,
                position: this.#bookings.length,
                flightID: this.#flightID
            });
            this.addNewTaskLocal({ 
                bookingID,
                name, 
                position: this.#bookings.length 
            });
            this.addNotification({text: addBookingResult.message, type: 'success'});
        }catch (err) {
            this.addNotification({text: err.message, type: 'error'});
            console.error(err);
        }
    };

    addNewTaskLocal = ({ bookingID = null, name, position }) => {
        const newTask = new Booking({
            bookingID,
            name,
            position
        });
        console.log(this.#bookings);
        this.#bookings.push(newTask);

        const newTaskElement = newTask.render();
        document.querySelector(`[id="${this.#flightID}"] .flight__bookings-list`)
            .appendChild(newTaskElement);
    }

    render() {
        const liElement = document.createElement('li');
        liElement.classList.add('flights-list__item'
        , 'flight'
        );
        liElement.setAttribute('id', this.#flightID);
        liElement.addEventListener(
            'dragstart', 
            () => localStorage.setItem('srcflightID', this.#flightID)
        );
        liElement.addEventListener('drop', this.onDropTaskInflight);
        const h2Element = document.createElement('h2');
        h2Element.classList.add('flight__name');
        console.log(this.#airType);
        h2Element.innerHTML = this.#direction;
        liElement.appendChild(h2Element);

        const h3Element = document.createElement('h3');
        h3Element.classList.add('flight__air-type');
        h3Element.innerHTML = this.#airType.airTypeName + ` [${this.#airType.airTypeCapacity}]`;
        liElement.appendChild(h3Element);

        const h3ElementDate = document.createElement('h3');
        h3ElementDate.classList.add('flight__date');
        h3ElementDate.innerHTML = new Date(Date.parse(this.#date)).toLocaleString("ru");
        liElement.appendChild(h3ElementDate);

        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('task__controls');
        controlsDiv.style = 'margin-bottom: 1vw;';

        const lowerRowDiv = document.createElement('div');
        lowerRowDiv.classList.add('task__controls-row');

        const editBtn = document.createElement('button');
        editBtn.setAttribute('type', 'button');
        editBtn.classList.add('task__control-btn', 'edit-icon');
        editBtn.addEventListener('click', 
        () => {
            localStorage.setItem('editFlightID', this.#flightID);
            document.getElementById('modal-edit-flight').showModal();
        });
        lowerRowDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.setAttribute('type', 'button');
        deleteBtn.classList.add('task__control-btn', 'delete-icon');
        deleteBtn.addEventListener('click',
        () => {
            localStorage.setItem('deleteFlightID', this.#flightID);

            const deleteBookingModal = document.getElementById('modal-delete-flight');
            deleteBookingModal.querySelector('.app-modal__question')
            .innerHTML = `Рейс '${this.#direction}' будет удален. Продолжить?`;
        
            deleteBookingModal.showModal();
        });
        lowerRowDiv.appendChild(deleteBtn);

        controlsDiv.appendChild(lowerRowDiv);

        liElement.appendChild(controlsDiv);


        const innerUlElement = document.createElement('ul');
        innerUlElement.classList.add('flight__bookings-list');
        liElement.appendChild(innerUlElement);

        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.classList.add('flight__add-booking-btn');
        button.innerHTML = '&#10010; Добавить бронь';
        button.addEventListener('click',  ()=> {
            localStorage.setItem('addBookingflightID', this.#flightID);
            document.getElementById('modal-add-booking').showModal();
        });
        liElement.appendChild(button);

        const adderElement = document.querySelector('.flight-adder');
        adderElement.parentElement.insertBefore(liElement, adderElement);
    }
};