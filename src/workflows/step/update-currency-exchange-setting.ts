// src/modules/currency-exchange/workflows/steps/update-currency-exchange-setting.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CURRENCY_EXCHANGE_MODULE } from "../../modules/currency-exchange"
import CurrencyExchangeService from "../../modules/currency-exchange/service"
import { ExchangeRateMode, ExchangeRateStatus } from "../../modules/currency-exchange/types"


type UpdateInput = {
  id: string
  mode?: ExchangeRateMode
  exchange_rate?: number
  status?: ExchangeRateStatus
}

export const updateCurrencyExchangeStep = createStep(
  "update-currency-exchange-setting",
  async (input: UpdateInput, { container }) => {
    const currencyExchangeService: CurrencyExchangeService = container.resolve(CURRENCY_EXCHANGE_MODULE)
    const query = container.resolve("query")

    const [current] = await currencyExchangeService.listCurrencyExchangeSettings({ id: input.id })
    if (!current) throw new Error("Setting not found")

    // Chuẩn bị data update
    let updateData: Partial<UpdateInput> & { id: string } = { id: input.id }

    // Update status nếu có truyền vào (enable/disable)
    if (input.status && input.status !== current.status) {
      updateData.status = input.status
    }

    // Update mode
    if (input.mode === ExchangeRateMode.AUTO && current.mode !== ExchangeRateMode.AUTO) {
      // Chuyển sang auto: fetch rate provider
      const { data: stores } = await query.graph({
        entity: "store",
        fields: ["supported_currencies.*"],
      })

      const supported = stores[0]?.supported_currencies || []
      const found = supported.find((c: any) => c.is_default === true)
      const baseCurrency = found?.currency_code
      if (!baseCurrency) throw new Error("Base currency not found")

      const rates = await currencyExchangeService.getExchangeRates(baseCurrency)
      updateData.exchange_rate = rates[current.currency_code]
      updateData.mode = ExchangeRateMode.AUTO

      // Debug log
      //console.log("Switch to AUTO, provider rates", rates)
    } else if (input.mode === ExchangeRateMode.MANUAL && current.mode !== ExchangeRateMode.MANUAL) {
      updateData.mode = ExchangeRateMode.MANUAL
      if (typeof input.exchange_rate === "number") {
        updateData.exchange_rate = input.exchange_rate
      }
    } else if (typeof input.exchange_rate === "number") {
      // Chỉ update rate (chỉ áp dụng mode manual)
      updateData.exchange_rate = input.exchange_rate
    }

    // Final log
    //console.log("Update currency_exchange_settings with", updateData)

    const [updated] = await currencyExchangeService.updateCurrencyExchangeSettings([updateData])
    return new StepResponse(updated)
  }
)