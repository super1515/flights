export default class Booking {
    #bookingID = null;
    #bookingName = '';
    #taskPosition = -1;

    constructor({
        bookingID = null,
        name,
        position
    }) {
        this.#bookingID = bookingID || crypto.randomUUID();
        this.#bookingName = name;
        this.#taskPosition = position;
    }
    
    get bookingID() { return this.#bookingID; }

    get bookingName() { return this.#bookingName; }
    set bookingName(value) {
        if (typeof value === 'string') {
            this.#bookingName = value;
        }
    }

    get taskPosition() { return this.#taskPosition; }
    set taskPosition(value) {
        if (typeof value === 'number' && value >= 0){
            this.#taskPosition = value;
        }
    }

    render() {
        const liElement = document.createElement('li');
        liElement.classList.add('flight__bookings-list-item', 'booking');
        liElement.setAttribute('id', this.#bookingID);
        liElement.setAttribute('draggable', true);
        liElement.addEventListener('dragstart', (evt) => {
            evt.target.classList.add('booking_selected');
            localStorage.setItem('movedbookingID', this.#bookingID);
        });
        liElement.addEventListener('dragend', (evt) => {
            evt.target.classList.remove('booking_selected');
        });


        const span = document.createElement('span');
        span.classList.add('task__text');
        span.innerHTML = this.#bookingName;
        liElement.appendChild(span);

        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('task__controls');

        const lowerRowDiv = document.createElement('div');
        lowerRowDiv.classList.add('task__controls-row');

        const editBtn = document.createElement('button');
        editBtn.setAttribute('type', 'button');
        editBtn.classList.add('task__control-btn', 'edit-icon');
        editBtn.addEventListener('click', 
        () => {
            localStorage.setItem('editbookingID', this.#bookingID);
            document.getElementById('modal-edit-booking').showModal();
        });
        lowerRowDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.setAttribute('type', 'button');
        deleteBtn.classList.add('task__control-btn', 'delete-icon');
        deleteBtn.addEventListener('click',
        () => {
            localStorage.setItem('deletebookingID', this.#bookingID);

            const deleteBookingModal = document.getElementById('modal-delete-booking');
            deleteBookingModal.querySelector('.app-modal__question')
            .innerHTML = `Бронь '${this.#bookingName}' будет удалена. Продолжить?`;
        
            deleteBookingModal.showModal();
        });
        lowerRowDiv.appendChild(deleteBtn);

        controlsDiv.appendChild(lowerRowDiv);

        liElement.appendChild(controlsDiv);

        return liElement;
    }
}