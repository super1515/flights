export default class AirType {
    #airTypeID = null;
    #name = '';
    #capacity = -1;

    constructor({
        airTypeID = null,
        name,
        capacity
    }) {
        this.#airTypeID = airTypeID;
        this.#name = name;
        this.#capacity = capacity;
    }
    get airTypeID() { return this.#airTypeID; }

    get airTypeName() { return this.#name; }
    get airTypeCapacity() { return this.#capacity; }
}