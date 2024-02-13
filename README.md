# Подготовка БД
Необходимо выполнить следующие SQL команды:
```
CREATE DATABASE flight_manager IF NOT EXISTS;

CREATE TABLE air_types (
id UUID PRIMARY KEY,
name VARCHAR(200) NOT NULL,
capacity INTEGER NOT NULL CHECK (capacity > 0)
) IF NOT EXISTS;

INSERT INTO air_types (id, name, capacity) VALUES ('25e80e60-db89-4fc0-948b-ace65e83f4a6', 'Airbus A320', 5);
INSERT INTO air_types (id, name, capacity) VALUES ('f9e82ac9-bce1-4d48-a1b5-2954230ef4bb', 'Антонов Ан-140', 7);
INSERT INTO air_types (id, name, capacity) VALUES ('6fd0181b-0b29-4a21-9537-bb55381bcec7', 'Cessna 208', 7);

CREATE TABLE flights (
id UUID PRIMARY KEY,
direction VARCHAR(100) NOT NULL,
date Timestamp NOT NULL,
position INTEGER NOT NULL CHECK (position >= 0),
air_types_id UUID REFERENCES air_types,
bookings UUID[] DEFAULT '{}'
) IF NOT EXISTS;

CREATE TABLE bookings (
id UUID PRIMARY KEY,
name VARCHAR(200) NOT NULL,
position INTEGER NOT NULL CHECK (position >= 0),
flight_id UUID REFERENCES flights
) IF NOT EXISTS;

ALTER TABLE flights ADD CONSTRAINT UQ_direction_date UNIQUE(direction, date);
ALTER TABLE bookings ADD CONSTRAINT UQ_name UNIQUE(name);

CREATE ROLE tm_admin LOGIN ENCRYPTED PASSWORD 'admin';
GRANT SELECT, INSERT, UPDATE, DELETE ON flights, bookings, air_types TO tm_admin;
```
# Запуск
Для запуска проекта необходимо выполнить следующие команды:

``npm install --dev vite@latest``

И наконец:

``npm run dev-back``
