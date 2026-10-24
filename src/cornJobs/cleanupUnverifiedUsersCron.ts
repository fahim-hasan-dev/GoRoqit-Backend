import cron from 'node-cron'
import { User } from '../app/modules/user/user.model'
import { ApplicantProfile } from '../app/modules/applicantProfile/applicantProfile.model'
import { RecruiterProfile } from '../app/modules/recruiterProfile/recruiterProfile.model'
import { Token } from '../app/modules/token/token.model'
import { USER_ROLES } from '../enum/user'
import { logger } from '../shared/logger'

// Runs daily at 03:00 AM to purge unverified accounts older than 24 hours
const cleanupUnverifiedCron = cron.schedule('0 3 * * *', async () => {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const staleUnverifiedQuery = {
      verified: false,
      role: { $ne: USER_ROLES.ADMIN },
      createdAt: { $lt: cutoffTime },
    }

    const staleUsers = await User.find(staleUnverifiedQuery).select('_id').lean()
    if (!staleUsers.length) return

    const userIds = staleUsers.map(u => u._id)

    await Promise.all([
      ApplicantProfile.deleteMany({ userId: { $in: userIds } }),
      RecruiterProfile.deleteMany({ userId: { $in: userIds } }),
      Token.deleteMany({ user: { $in: userIds } }),
    ])

    const deleteResult = await User.deleteMany({ _id: { $in: userIds } })
    logger.info(`🧹 Daily cron purged ${deleteResult.deletedCount} unverified stale accounts.`)
  } catch (error) {
    logger.error('Error during daily unverified user cleanup cron:', error)
  }
})

cleanupUnverifiedCron.start()

export default cleanupUnverifiedCron
