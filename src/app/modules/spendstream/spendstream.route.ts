import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { SpendstreamController } from './spendstream.controller'

const router = express.Router()

router.get(
  '/sso-url',
  auth(USER_ROLES.APPLICANT, USER_ROLES.RECRUITER, USER_ROLES.ADMIN),
  SpendstreamController.getRewardsUrl,
)

export const SpendstreamRoutes = router
