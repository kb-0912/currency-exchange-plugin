import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ExchangeRateMode, ExchangeRateStatus } from "../../../../modules/currency-exchange/types";
import { updateCurrencyExchangeStep } from "../../../../workflows/step/update-currency-exchange-setting";

const updateCurrencyExchangeWorkflow = createWorkflow(
  "update-currency-exchange-workflow",
  function(input: { id: string; mode?: ExchangeRateMode; status?: ExchangeRateStatus ; exchange_rate?: number }) {
    const setting = updateCurrencyExchangeStep({
      id: input.id,
      mode: input.mode as any, // phải đúng enum
    status: input.status as any, // phải đúng enum
      exchange_rate: input.exchange_rate,
    })
    return new WorkflowResponse({ setting })
  }
)

export const PATCH = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { mode, status, exchange_rate } = req.body as { mode?: ExchangeRateMode ; status?: ExchangeRateStatus ; exchange_rate?: number }
  const wf = await updateCurrencyExchangeWorkflow(req.scope).run({
    input: { id, mode, status, exchange_rate }
  })
  res.json({ setting: wf.result.setting })
}

