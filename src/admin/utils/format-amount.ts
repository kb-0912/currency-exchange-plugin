// src/admin/utils/format-amount.ts
export const formatAmount = (amount: number, currency_code: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency_code,
    }).format(amount)
  }