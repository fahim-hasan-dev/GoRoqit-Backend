import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

export const checkHoneypot = (req: Request, res: Response, next: NextFunction): void => {
  // If a bot fills any hidden honeypot field, silently block without doing work
  const honeypot = req.body?.honeypot || req.body?.website_url_check || req.body?.fax_number
  if (honeypot && String(honeypot).trim() !== '') {
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Request processed successfully.',
    })
    return
  }
  next()
}
