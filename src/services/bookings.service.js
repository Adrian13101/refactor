import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import { isPositiveInt, isValidDate, isValidTime } from "../utils/validators.js";

const RULES = {
  customerName: [(v) => typeof v === "string" && v.trim() !== "", "customerName debe ser un string no vacío"],
  customerEmail: [
    (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "customerEmail debe ser un email válido",
  ],
  date: [isValidDate, "date debe tener formato YYYY-MM-DD y ser una fecha válida"],
  time: [isValidTime, "time debe tener formato HH:MM (24 hs)"],
};

function validateBooking(body) {
  const errors = [];
  const data = body ?? {};

  for (const [field, [isValid, message]] of Object.entries(RULES)) {
    const value = data[field];
    if (value === undefined) {
      errors.push(`${field} es obligatorio`);
    } else if (!isValid(value)) {
      errors.push(message);
    }
  }
  return errors;
}

// Solo deja pasar los campos permitidos (ignora id, services y cualquier otro campo)
const pick = ({ customerName, customerEmail, date, time } = {}) => ({
  customerName,
  customerEmail,
  date,
  time,
});

// Service de reservas: para validar el servicio que se agrega usa ServicesService
// (otra regla de negocio), nunca accede directamente a los archivos.
export default class BookingsService {
  constructor(bookingsRepository, servicesService) {
    this.repository = bookingsRepository;
    this.servicesService = servicesService;
  }

  async createBooking(body) {
    const errors = validateBooking(body);
    if (errors.length) throw new ValidationError("Datos inválidos", errors);

    return this.repository.create(pick(body));
  }

  async getBookingById(bid) {
    if (!isPositiveInt(bid)) throw new ValidationError("El bid debe ser un entero positivo");

    const booking = await this.repository.getById(bid);
    if (!booking) throw new NotFoundError("Reserva no encontrada");
    return booking;
  }

  async addServiceToBooking(bid, sid) {
    if (!isPositiveInt(bid)) throw new ValidationError("El bid debe ser un entero positivo");
    if (!isPositiveInt(sid)) throw new ValidationError("El sid debe ser un entero positivo");

    const booking = await this.getBookingById(bid);

    // Lanza 404 si el servicio no existe
    const service = await this.servicesService.getServiceById(sid);
    if (!service.available) {
      throw new ValidationError("El servicio indicado no está disponible");
    }
    if (booking.services.includes(service.id)) {
      throw new ConflictError("El servicio ya está incluido en la reserva");
    }

    return this.repository.addService(bid, sid);
  }
}
