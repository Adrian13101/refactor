import path from "node:path";
import { fileURLToPath } from "node:url";

import ServicesDAO from "./dao/services.dao.js";
import BookingsDAO from "./dao/bookings.dao.js";
import ServicesRepository from "./repositories/services.repository.js";
import BookingsRepository from "./repositories/bookings.repository.js";
import ServicesService from "./services/services.service.js";
import BookingsService from "./services/bookings.service.js";

// Punto único donde se "arma" la aplicación: DAO -> Repository -> Service.
// Para pasar a MongoDB solo habrá que reemplazar los DAO de acá.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");

const servicesDAO = new ServicesDAO(path.join(dataDir, "services.json"));
const bookingsDAO = new BookingsDAO(path.join(dataDir, "bookings.json"));

const servicesRepository = new ServicesRepository(servicesDAO);
const bookingsRepository = new BookingsRepository(bookingsDAO);

export const servicesService = new ServicesService(servicesRepository);
export const bookingsService = new BookingsService(bookingsRepository, servicesService);
