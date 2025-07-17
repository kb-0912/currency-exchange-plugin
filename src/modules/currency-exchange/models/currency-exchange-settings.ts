// src/modules/currency-exchange/models/currency-exchange-settings.ts
import { model } from "@medusajs/framework/utils"
import { ExchangeRateMode, ExchangeRateStatus } from "../types"


export const CurrencyExchangeSettings = model.define("currency_exchange_settings", {
  id: model.id().primaryKey(),
  currency_code: model.text(),
  exchange_rate: model.float().default(1),
  mode: model.enum(Object.values(ExchangeRateMode)).default(ExchangeRateMode.AUTO),
  status: model.enum(Object.values(ExchangeRateStatus)).default(ExchangeRateStatus.DISABLE),
})