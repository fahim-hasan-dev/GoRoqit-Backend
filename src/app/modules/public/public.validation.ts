import { z } from 'zod'
import { safeEmailValidation, safeNameValidation } from '../user/user.validation'

const contactZodSchema = z.object({
  body: z.object({
    name: safeNameValidation,
    email: safeEmailValidation,
    phone: z.string().optional(),
    message: z
      .string({
        required_error: 'Message is required',
      })
      .trim()
      .min(5, 'Message must be at least 5 characters')
      .max(1500, 'Message cannot exceed 1500 characters'),
    honeypot: z.string().optional(),
  }),
})

export const PublicValidation = {
  create: z.object({
    body: z.object({
      content: z.string(),
      type: z.enum(['privacy-policy', 'terms-and-condition','contact','about']),
    }),
  }),

  update: z.object({
    body: z.object({
      content: z.string(),
      type: z.enum(['privacy-policy', 'terms-and-condition','contact','about']),
    }),
  }),
  contactZodSchema,
}

export const FaqValidations = {
  create: z.object({
    body: z.object({
      question: z.string(),
      answer: z.string(),
    }),
  }),

  update: z.object({
    body: z.object({
      question: z.string().optional(),
      answer: z.string().optional(),
    }),
  }),
}
