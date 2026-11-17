import fs from "node:fs/promises";

// Compara sin importar mayúsculas ni tildes ("estetica" encuentra "estética")
const normalize = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

// DAO: único lugar que sabe CÓMO se guardan los servicios (hoy, un archivo JSON).
// No tiene reglas de negocio ni conoce req/res.
export default class ServicesDAO {
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

  async #writeFile(services) {
    await fs.writeFile(this.filePath, JSON.stringify(services, null, 2));
  }

  #generateId(services) {
    return services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1;
  }

  // Filtros opcionales: { category?: string, available?: boolean }
  async getAll({ category, available } = {}) {
    let services = await this.#readFile();

    if (category !== undefined) {
      const wanted = normalize(category);
      services = services.filter((s) => normalize(s.category) === wanted);
    }
    if (available !== undefined) {
      services = services.filter((s) => s.available === available);
    }
    return services;
  }

  async getById(id) {
    const services = await this.#readFile();
    return services.find((s) => s.id === Number(id)) ?? null;
  }

  async create(data) {
    const services = await this.#readFile();
    const { name, description, duration, price, category, available } = data;
    const newService = {
      id: this.#generateId(services),
      name,
      description,
      duration,
      price,
      category,
      available,
    };

    services.push(newService);
    await this.#writeFile(services);
    return newService;
  }

  async update(id, data) {
    const services = await this.#readFile();
    const index = services.findIndex((s) => s.id === Number(id));
    if (index === -1) return null;

    // Se descarta el id para que no pueda modificarse.
    const { id: _ignored, ...safeData } = data;
    services[index] = { ...services[index], ...safeData, id: services[index].id };

    await this.#writeFile(services);
    return services[index];
  }

  async delete(id) {
    const services = await this.#readFile();
    const index = services.findIndex((s) => s.id === Number(id));
    if (index === -1) return null;

    const [deleted] = services.splice(index, 1);
    await this.#writeFile(services);
    return deleted;
  }
}
