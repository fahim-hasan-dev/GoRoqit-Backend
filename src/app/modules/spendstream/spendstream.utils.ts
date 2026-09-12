import crypto from 'crypto'

/**
 * Formats a Date object into 'YYYY-MM-DD HH:MM:SS' string in UTC
 * as required by Spendstream's authentication specification.
 */
export const formatUtcTimestamp = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = date.getUTCFullYear()
  const month = pad(date.getUTCMonth() + 1)
  const day = pad(date.getUTCDate())
  const hours = pad(date.getUTCHours())
  const minutes = pad(date.getUTCMinutes())
  const seconds = pad(date.getUTCSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Computes the HMAC-SHA256 signature required by Spendstream:
 * code = hash_hmac('sha256', api_key + time_stamp, api_secret)
 */
export const generateHmacSignature = (
  apiKey: string,
  timestamp: string,
  secretKey: string,
): string => {
  return crypto
    .createHmac('sha256', secretKey)
    .update(apiKey + timestamp)
    .digest('hex')
}
