// src/admin/lib/sdk-extensions.ts
import { sdk } from "../sdk"

type CurrencyExchangeSettingsEndpoints = {
  list: (queryParams?: any) => Promise<any>;
  retrieve: (id: string, queryParams?: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  enable: (data: { currency_code: string }) => Promise<any>;
  disable: (id: string, data: any) => Promise<any>;
  trigger: () => Promise<any>; 
}

declare module "@medusajs/js-sdk" {
  interface Admin {
    currencyExchangeSettings: CurrencyExchangeSettingsEndpoints;
  }
}

sdk.admin.currencyExchangeSettings = {
  list: (queryParams = {}) =>
    sdk.client.fetch("/admin/currency-exchange-settings", { query: queryParams }),
  retrieve: (id: string, queryParams = {}) =>
    sdk.client.fetch(`/admin/currency-exchange-settings/${id}`, { query: queryParams }),
  update: (id: string, data: any) =>
    sdk.client.fetch(`/admin/currency-exchange-settings/${id}`, { method: "PATCH", body: data }),
  enable: (data: { currency_code: string }) =>
    sdk.client.fetch(`/admin/currency-exchange-settings/enable`, { method: "POST", body: data }),
  disable: (id: string, data: any) =>
    sdk.client.fetch(`/admin/currency-exchange-settings/${id}`, { method: "PATCH", body: data }),
  trigger: () =>
    sdk.client.fetch(`/admin/currency-exchange-settings/update-currency-rates`, { method: "POST" }), 
}

export { sdk }