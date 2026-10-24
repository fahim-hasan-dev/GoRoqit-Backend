import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Secret } from 'jsonwebtoken'
import config from '../../config'
import { jwtHelper } from '../../helpers/jwtHelper'
import ApiError from '../../errors/ApiError'

const auth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenWithBearer = req.headers.authorization


      if (!tokenWithBearer) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authorization token not found!')
      }

      if (!tokenWithBearer.startsWith('Bearer ')) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Invalid authorization format. Format must be "Bearer <token>"',
        )
      }

      const token = tokenWithBearer.split(' ')[1]
      if (!token) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Access token is required')
      }

      try {
        const verifyUser = jwtHelper.verifyToken(
          token,
          config.jwt.jwt_secret as Secret,
        )

        req.user = verifyUser

        if (roles.length && !roles.includes(verifyUser.role)) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "You don't have permission to access this API",
          )
        }

        next()
      } catch (error) {
        if (error instanceof Error && error.name === 'TokenExpiredError') {
          throw new ApiError(StatusCodes.UNAUTHORIZED, 'Access Token has expired')
        }
        next(error)
      }
    } catch (error) {
      next(error)
    }
  }

export default auth

// Temporary auth middleware for verification tokens
export const tempAuth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenWithBearer = req.headers.authorization
      if (!tokenWithBearer) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authorization token not found!')
      }

      if (!tokenWithBearer.startsWith('Bearer ')) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Invalid authorization format. Format must be "Bearer <token>"',
        )
      }

      const token = tokenWithBearer.split(' ')[1]
      if (!token) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Access token is required')
      }

      try {
        const verifyUser = jwtHelper.verifyToken(
          token,
          config.jwt.temp_jwt_secret as Secret,
        )

        req.user = verifyUser

        if (roles.length && !roles.includes(verifyUser.role)) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "You don't have permission to access this API",
          )
        }

        next()
      } catch (error) {
        if (error instanceof Error && error.name === 'TokenExpiredError') {
          throw new ApiError(StatusCodes.UNAUTHORIZED, 'Access Token has expired')
        }
        throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid Access Token')
      }
    } catch (error) {
      next(error)
    }
  }
