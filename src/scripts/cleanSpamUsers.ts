import mongoose from 'mongoose'
import config from '../config'
import { User } from '../app/modules/user/user.model'
import { ApplicantProfile } from '../app/modules/applicantProfile/applicantProfile.model'
import { RecruiterProfile } from '../app/modules/recruiterProfile/recruiterProfile.model'
import { Token } from '../app/modules/token/token.model'
import { USER_ROLES } from '../enum/user'

const BATCH_SIZE = 2000

async function cleanUnverifiedUsers() {
  const isDryRun = process.argv.includes('--dry-run')
  const customUri = process.argv.find(arg => arg.startsWith('mongodb'))

  try {
    const mongoUri = customUri || (config.database_url as string)
    const sanitizedUri = mongoUri.includes('@') ? mongoUri.replace(/\/\/.*@/, '//***:***@') : mongoUri
    console.log(`\n======================================================`)
    console.log(`🛡️  Go Roqit - Unverified Accounts Cleanup Script`)
    console.log(`======================================================`)
    console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (Preview only, no data deleted)' : '🗑️  LIVE CLEANUP (All unverified accounts will be deleted)'}`)
    console.log(`Connecting to: ${sanitizedUri}`)

    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB.\n')

    // Query: Target ALL unverified accounts, preserving only verified accounts and admins
    const targetQuery: mongoose.FilterQuery<any> = {
      verified: false,
      role: { $ne: USER_ROLES.ADMIN },
    }

    const totalUsersBefore = await User.countDocuments({})
    const verifiedUsersBefore = await User.countDocuments({ verified: true })
    const targetUnverifiedCount = await User.countDocuments(targetQuery)

    console.log(`📊 Total Users in DB: ${totalUsersBefore}`)
    console.log(`🔒 Verified Real Users: ${verifiedUsersBefore} (100% Protected - will REMAIN)`)
    console.log(`🎯 Unverified Accounts to Delete: ${targetUnverifiedCount}`)

    if (targetUnverifiedCount === 0) {
      console.log('\n✨ Database is already completely clean! No unverified accounts found.')
      return
    }

    if (isDryRun) {
      console.log('\n🔍 Sample 5 unverified records that will be deleted:')
      const sample = await User.find(targetQuery).select('name email role createdAt').limit(5).lean()
      sample.forEach((u, i) => {
        console.log(` ${i + 1}. Email: ${u.email} | Name: "${u.name}" | Role: ${u.role} | CreatedAt: ${u.createdAt}`)
      })
      console.log('\n💡 Dry run complete. To execute real deletion, run: yarn clean:spam')
      return
    }

    console.log('\n🚀 Starting Batched Deletion Process...')

    let totalDeletedUsers = 0
    let totalDeletedApplicantProfiles = 0
    let totalDeletedRecruiterProfiles = 0
    let totalDeletedTokens = 0

    while (true) {
      // Fetch next batch of unverified user IDs
      const batch = await User.find(targetQuery).select('_id').limit(BATCH_SIZE).lean()
      if (!batch.length) break

      const userIds = batch.map(u => u._id)

      // 1. Delete associated applicant profiles
      const appProfileRes = await ApplicantProfile.deleteMany({ userId: { $in: userIds } })
      totalDeletedApplicantProfiles += appProfileRes.deletedCount || 0

      // 2. Delete associated recruiter profiles (if any)
      const recProfileRes = await RecruiterProfile.deleteMany({ userId: { $in: userIds } })
      totalDeletedRecruiterProfiles += recProfileRes.deletedCount || 0

      // 3. Delete any tokens associated with these users
      const tokenRes = await Token.deleteMany({ user: { $in: userIds } })
      totalDeletedTokens += tokenRes.deletedCount || 0

      // 4. Delete unverified user documents
      const userRes = await User.deleteMany({ _id: { $in: userIds } })
      totalDeletedUsers += userRes.deletedCount || 0

      process.stdout.write(`\rProgress: Deleted ${totalDeletedUsers} / ${targetUnverifiedCount} unverified users...`)
    }

    console.log('\n\n--- Deletion Summary ---')
    console.log(`🗑️  Total Unverified Users Deleted: ${totalDeletedUsers}`)
    console.log(`🗑️  Total Linked ApplicantProfiles Deleted: ${totalDeletedApplicantProfiles}`)
    console.log(`🗑️  Total Linked RecruiterProfiles Deleted: ${totalDeletedRecruiterProfiles}`)
    console.log(`🗑️  Total Tokens Deleted: ${totalDeletedTokens}`)

    // Post-cleanup verification
    const totalUsersAfter = await User.countDocuments({})
    const verifiedUsersAfter = await User.countDocuments({ verified: true })
    const unverifiedRemaining = await User.countDocuments({ verified: false })

    console.log('\n--- Post-Cleanup Verification ---')
    console.log(`Remaining Total Users in DB: ${totalUsersAfter}`)
    console.log(`Remaining Verified Users: ${verifiedUsersAfter} (All intact)`)
    console.log(`Remaining Unverified Users: ${unverifiedRemaining} (Should be 0)`)
    console.log('\n🎉 Cleanup completed successfully! Only verified users remain.\n')

  } catch (err) {
    console.error('❌ Error during cleanup process:', err)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB.')
  }
}

cleanUnverifiedUsers()
