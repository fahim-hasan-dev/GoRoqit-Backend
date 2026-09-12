export interface ISpendstreamTokenResponse {
  message: string
  created_on: number
  expiry: number
  token: string
}

export interface ISpendstreamUserPayload {
  UID: string
  name?: string
  email?: string
  phone?: string
  whitelabel?: string
}

export interface ISpendstreamRegisterResponse {
  users?: Record<string, any>
  message?: string
  error?: string
  response?: number
}

export interface ISpendstreamSSOResult {
  url: string
  registered: boolean
}
