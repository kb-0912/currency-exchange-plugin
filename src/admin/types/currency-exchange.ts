// src/admin/types/currency-exchange.ts

import { FindParams, PaginatedResponse } from "@medusajs/framework/types"

// 1. Enum
export enum ExchangeRateMode {
  MANUAL = "manual",
  AUTO = "auto",
}

export enum ExchangeRateStatus {
  ENABLE = "enable",
  DISABLE = "disable",
}

// 2. Main type
export type AdminCurrencyExchangeSetting = {
  id: string | null
  currency_code: string
  exchange_rate: number
  mode: ExchangeRateMode
  created_at: string | null
  updated_at: string | null
  status?: ExchangeRateStatus
  symbol?: string // optional nếu API trả về
}

// 3. Query params
export interface AdminCurrencyExchangeQueryParams extends FindParams {
  currency_code?: string
  mode?: ExchangeRateMode
  status?: ExchangeRateStatus
}

// 4. Response types
export type AdminCurrencyExchangeSettingsResponse = PaginatedResponse<{
  settings: AdminCurrencyExchangeSetting[]
}>
export type AdminCurrencyExchangeSettingResponse = {
  setting: AdminCurrencyExchangeSetting
}

// 5. Update request
export type AdminUpdateCurrencyExchangeSettingRequest = {
  exchange_rate?: number
  mode?: ExchangeRateMode
  status?: ExchangeRateStatus
}

// 6. Enable request
export type AdminEnableCurrencyExchangeSettingRequest = {
  currency_code: string
}