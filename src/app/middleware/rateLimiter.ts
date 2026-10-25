import rateLimit from 'express-rate-limit'
import { StatusCodes } from 'http-status-codes'

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: req => {
    const url = req.originalUrl || req.url || ''
    return url.includes('/api/v1/auth')
  },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
})

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
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
  limit: 10,
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
