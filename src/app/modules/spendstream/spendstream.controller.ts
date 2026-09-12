import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { JwtPayload } from 'jsonwebtoken'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { SpendstreamService } from './spendstream.service'

const getRewardsUrl = catchAsync(async (req: Request, res: Response) => {
  const userPayload = req.user as JwtPayload
  const userId = String(userPayload.authId || userPayload.id || userPayload._id)
  const result = await SpendstreamService.getRewardsSsoUrl(userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Rewards portal SSO URL generated successfully',
    data: result,
  })
})

export const SpendstreamController = {
  getRewardsUrl,
}
