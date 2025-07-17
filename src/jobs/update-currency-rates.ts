// src/jobs/update-currency-rates.ts
import { MedusaContainer } from "@medusajs/framework/types"
import { updatePricesWithExchangeRates } from "../workflows/update-prices-with-exchange-rates"

export default async function updateCurrencyRatesJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  logger.info("Run update-currency-rates-job")
  await updatePricesWithExchangeRates(container).run()
}

export const config = {
  name: "update-currency-rates-job",
  schedule: "0 0 * * *",
}