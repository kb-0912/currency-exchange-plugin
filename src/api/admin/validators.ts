import {
    createFindParams,
  } from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"

// Params cho list/get currency exchange settings
export const AdminGetCurrencyExchangeSettingParams = createFindParams({
  limit: 20,
  offset: 0,
}).strict()

// Schema cho update currency exchange settings
export const AdminUpdateCurrencyExchangeSettingSchema = z.object({
  // chỉ được phép update 1 hoặc nhiều field sau:
  exchange_rate: z.number().min(0).max(999999).optional(),
  mode: z.enum(["manual", "auto"]).optional(),
  status: z.enum(["enable", "disable"]).optional(),
  currency_code: z.string().min(1).max(6).optional(), // phòng trường hợp cho phép đổi code
})
export type AdminUpdateCurrencyExchangeSettingType = z.infer<typeof AdminUpdateCurrencyExchangeSettingSchema>