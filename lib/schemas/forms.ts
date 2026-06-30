/**
 * Esquemas Zod compartidos para validación server-side.
 *
 * Arquitectura:
 * - Estos esquemas son la FUENTE DE VERDAD para la validación del servidor.
 * - Los componentes de formulario del cliente importan estos esquemas y
 *   añaden mensajes de error i18n por encima (usando .superRefine o
 *   el segundo argumento de los métodos Zod).
 * - Así se garantiza que server y client siempre validan con las mismas reglas,
 *   evitando divergencias silenciosas.
 *
 * IMPORTANTE: No importar next-intl aquí — este archivo se ejecuta en el servidor
 * sin contexto de locale.
 */

import { z } from 'zod'

/* ==========================================================================
   Contacto — /api/contact
   ========================================================================== */

export const contactSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(2),
  message: z.string().min(10),
  privacy: z.literal(true),
})

export type ContactInput = z.infer<typeof contactSchema>

/* ==========================================================================
   Newsletter — /api/newsletter
   ========================================================================== */

export const newsletterSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  privacy: z.literal(true),
})

export type NewsletterInput = z.infer<typeof newsletterSchema>

/* ==========================================================================
   Testers — /api/testers
   ========================================================================== */

export const testersSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  profession: z.string().min(2),
  gender: z.string().optional(),
  birthdate: z.string().min(1),
  householdSituation: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  privacy: z.literal(true),
})

export type TestersInput = z.infer<typeof testersSchema>

/* ==========================================================================
   Barcelona Design Week 2026 — /api/bdw
   ========================================================================== */

export const bdwSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  birthdate: z.string().min(1),
  gender: z.string().optional(),
  householdSituation: z.string().min(2),
  profession: z.string().min(2),
  city: z.string().min(2),
  privacy: z.literal(true),
})

export type BdwInput = z.infer<typeof bdwSchema>
