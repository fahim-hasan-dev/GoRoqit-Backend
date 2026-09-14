import config from '../../../config'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { logger } from '../../../shared/logger'
import { User } from '../user/user.model'
import {
  ISpendstreamTokenResponse,
  ISpendstreamUserPayload,
  ISpendstreamSSOResult,
} from './spendstream.interface'
import { formatUtcTimestamp, generateHmacSignature } from './spendstream.utils'

// In-memory token cache to prevent hitting the 5 req/min rate limit on getToken
let cachedBearerToken: string | null = null
let tokenExpiryTimestamp = 0

/**
 * Exchange API credentials for a Spendstream Bearer token.
 * Tokens are valid for 10 hours.
 */
const getSpendstreamBearerToken = async (): Promise<string> => {
  const nowUnix = Math.floor(Date.now() / 1000)

  // Use cached token if valid for at least 5 more minutes
  if (cachedBearerToken && tokenExpiryTimestamp > nowUnix + 300) {
    return cachedBearerToken
  }

  const apiKey = config.spendstream.apiKey
  const secretKey = config.spendstream.secretKey
  const baseUrl = config.spendstream.baseUrl

  if (!apiKey || !secretKey) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Spendstream credentials are not configured in backend environment.',
    )
  }

  const timestamp = formatUtcTimestamp()
  const code = generateHmacSignature(apiKey, timestamp, secretKey)

  try {
    const response = await fetch(`${baseUrl}/getToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        time_stamp: timestamp,
        code,
      }),
    })

    const data = (await response.json()) as ISpendstreamTokenResponse & {
      error?: string
    }

    if (!response.ok || !data.token) {
      console.error('=== SPENDSTREAM AUTH ERROR RESPONSE ===')
      console.error('Status:', response.status, response.statusText)
      console.error('Response Data:', data)
      console.error('=======================================')

      logger.error(`Spendstream getToken failed [HTTP ${response.status}]: ${JSON.stringify(data)}`)

      throw new ApiError(
        StatusCodes.BAD_GATEWAY,
        `Spendstream Auth Failed: ${data.error || data.message || response.statusText}`,
      )
    }

    cachedBearerToken = data.token
    tokenExpiryTimestamp = data.expiry || nowUnix + 36000

    return cachedBearerToken
  } catch (error: any) {
    if (error instanceof ApiError) throw error
    console.error('Spendstream Connection Error:', error)
    logger.error(`Spendstream connection error: ${error.message}`)
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Spendstream service error: ${error.message}`,
    )
  }
}

/**
 * Register a GoRoqit user on Spendstream and retrieve the SSO user token.
 * Handles idempotency gracefully: if the user already exists (400), fetches their existing SSO token.
 */
const registerUserOnSpendstream = async (
  payload: ISpendstreamUserPayload,
): Promise<{ registered: boolean; ssoToken?: string }> => {
  const bearerToken = await getSpendstreamBearerToken()
  const baseUrl = config.spendstream.baseUrl

  const response = await fetch(`${baseUrl}/addNewUser`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      UID: payload.UID,
      name: payload.name || '-',
      email: payload.email || '',
      phone: payload.phone || '',
      whitelabel: payload.whitelabel || '0',
    }),
  })

  const data = (await response.json()) as any

  // 1. Success on new user registration (HTTP 200 and data.users.response === 200)
  if (response.ok && data?.users?.response === 200) {
    const ssoToken = data.users.user?.token
    return { registered: true, ssoToken }
  }

  // 2. User already exists (either HTTP 200 with response 400, or HTTP 400)
  const isAlreadyExists =
    (data?.users?.response === 400 &&
      data?.users?.message?.toLowerCase().includes('already exists')) ||
    (response.status === 400 &&
      JSON.stringify(data).toLowerCase().includes('already exists'))

  if (isAlreadyExists) {
    // Lookup user's SSO token via getUsersList
    try {
      const listResponse = await fetch(
        `${baseUrl}/getUsersList?UID=${encodeURIComponent(payload.UID)}`,
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            Accept: 'application/json',
          },
        },
      )
      if (listResponse.ok) {
        const listData = (await listResponse.json()) as any
        const existingToken = listData?.users?.['users-list']?.[0]?.token
        return { registered: true, ssoToken: existingToken }
      }
    } catch (listErr) {
      logger.warn(`Could not retrieve existing SSO token for UID ${payload.UID}:`, listErr)
    }

    return { registered: true }
  }

  console.error('=== SPENDSTREAM REGISTER USER ERROR ===')
  console.error('Status:', response.status, response.statusText)
  console.error('Response Data:', data)
  console.error('=======================================')

  throw new ApiError(
    StatusCodes.BAD_GATEWAY,
    `Spendstream User Registration Failed: ${
      data?.users?.message || data?.error || data?.message || response.statusText
    }`,
  )
}

/**
 * Prepares the SSO Redirect URL for an authenticated user.
 * Only returns the URL if Spendstream registration/lookup succeeds.
 */
const getRewardsSsoUrl = async (
  userId: string,
): Promise<ISpendstreamSSOResult> => {
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found in GoRoqit database')
  }

  const uid = String(user._id)
  const userEmail = user.email || ''
  const userName = user.name || ''

  // Register user on Spendstream or get existing SSO token
  const { ssoToken } = await registerUserOnSpendstream({
    UID: uid,
    email: userEmail,
    name: userName,
    whitelabel: '0',
  })

  // Construct destination URL only after successful Spendstream verification
  const whitelabelUrl = config.spendstream.whitelabelUrl.replace(/\/+$/, '')
  const redirectUrl = ssoToken
    ? `${whitelabelUrl}/login/${encodeURIComponent(ssoToken)}`
    : `${whitelabelUrl}/login`

  return {
    url: redirectUrl,
    registered: true,
  }
}

export const SpendstreamService = {
  getSpendstreamBearerToken,
  registerUserOnSpendstream,
  getRewardsSsoUrl,
}
