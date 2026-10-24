import rateLimit from 'express-rate-limit'
import { StatusCodes } from 'http-status-codes'

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
})

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many account creation attempts from this IP. Please try again after 15 minutes.',
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
})

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed login attempts from this IP. Please try again after 15 minutes.',
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
})

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please try again after 15 minutes.',
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
})

export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many contact messages submitted from this IP. Please try again later.',
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
})
