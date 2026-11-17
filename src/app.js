import express from "express";
import servicesRouter from "./routes/services.router.js";
import bookingsRouter from "./routes/bookings.router.js";
import { AppError } from "./utils/errors.js";

const app = express();

app.use(express.json());

app.use("/api/services", servicesRouter);
app.use("/api/bookings", bookingsRouter);

// 404 para rutas inexistentes
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Ruta no encontrada" });
});

// Manejo de errores (incluye JSON mal formado)
app.use((err, req, res, next) => {
  // Errores controlados lanzados por los services (400, 404, 409...)
  if (err instanceof AppError) {
    const body = { status: "error", message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ status: "error", message: "JSON inválido" });
  }
  console.error(err);
  res.status(500).json({ status: "error", message: "Error interno del servidor" });
});

export default app;
