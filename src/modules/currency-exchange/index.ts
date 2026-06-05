// src/modules/currency-exchange/index.ts
import { Module } from "@medusajs/framework/utils"
import CurrencyExchangeService from "./service"

export const CURRENCY_EXCHANGE_MODULE = "currencyExchangeService"

export default Module(CURRENCY_EXCHANGE_MODULE, {
  service: CurrencyExchangeService,
})