import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updatePricesWithExchangeRates } from "../../../../workflows/update-prices-with-exchange-rates"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await updatePricesWithExchangeRates(req.scope).run({
    input: { name: req.query.name as string },
  })
  res.send(result)
}