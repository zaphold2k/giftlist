import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  email: z.email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
});

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const listSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  eventDate: z.string().optional().or(z.literal("")),
});

export const itemSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  imageUrl: z.union([z.url("URL inválida"), z.literal("")]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  quantityWanted: z.coerce.number().int().min(1).max(99).default(1),
});

export const itemLinkSchema = z.object({
  label: z.string().trim().max(60).optional().or(z.literal("")),
  url: z.url("Enlace inválido"),
});

export const addAdminSchema = z.object({
  email: z.email("Email inválido"),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(40),
});

export const reservationSchema = z.object({
  guestName: z.string().trim().min(1, "Tu nombre es obligatorio").max(100),
  guestEmail: z.union([z.email("Email inválido"), z.literal("")]).optional(),
  message: z.string().trim().max(500).optional().or(z.literal("")),
});
