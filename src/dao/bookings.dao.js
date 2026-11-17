import fs from "node:fs/promises";

// DAO: único lugar que sabe CÓMO se guardan las reservas (hoy, un archivo JSON).
export default class BookingsDAO {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async #readFile() {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  async #writeFile(bookings) {
    await fs.writeFile(this.filePath, JSON.stringify(bookings, null, 2));
  }

  #generateId(bookings) {
    return bookings.length > 0 ? Math.max(...bookings.map((b) => b.id)) + 1 : 1;
  }

  async getById(id) {
    const bookings = await this.#readFile();
    return bookings.find((b) => b.id === Number(id)) ?? null;
  }

  // Se ignora cualquier id recibido: se genera internamente.
  // La reserva se crea sin servicios; se agregan después con addService.
  async create(data) {
    const bookings = await this.#readFile();
    const { customerName, customerEmail, date, time } = data;
    const newBooking = {
      id: this.#generateId(bookings),
      customerName,
      customerEmail,
      date,
      time,
      services: [],
    };

    bookings.push(newBooking);
    await this.#writeFile(bookings);
    return newBooking;
  }

  // Agrega el id del servicio a la reserva (sin duplicados).
  // Devuelve la reserva actualizada o null si la reserva no existe.
  async addService(bookingId, serviceId) {
    const bookings = await this.#readFile();
    const index = bookings.findIndex((b) => b.id === Number(bookingId));
    if (index === -1) return null;

    if (!bookings[index].services.includes(Number(serviceId))) {
      bookings[index].services.push(Number(serviceId));
      await this.#writeFile(bookings);
    }
    return bookings[index];
  }
}
