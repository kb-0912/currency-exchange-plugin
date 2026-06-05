// src/api/admin/currency-exchange-settings/query-config.ts
export const currencyExchangeFields = [
  "id",
  "currency_code",
  "exchange_rate",
  "mode"
]

export const retrieveAdminCurrencyExchangeQueryConfig = {
  defaults: currencyExchangeFields,
  isList: false,
}

export const listAdminCurrencyExchangeQueryConfig = {
  defaults: currencyExchangeFields,
  isList: true,
}