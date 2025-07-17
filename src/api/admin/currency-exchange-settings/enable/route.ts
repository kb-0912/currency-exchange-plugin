import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { enableCurrencyExchangeStep } from "../../../../workflows/step/enable-currency-exchange-setting"

const enableExchangeWorkflow = createWorkflow(
  "enable-currency-exchange-workflow",
  function(input: { currency_code: string }) {
    const setting = enableCurrencyExchangeStep({
      currency_code: input.currency_code,
    })
    return new WorkflowResponse({ setting })
  }
)

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { currency_code } = req.body as { currency_code: string }
  const wf = await enableExchangeWorkflow(req.scope).run({
    input: { currency_code }
  })

  res.json({ setting: wf.result.setting })
}