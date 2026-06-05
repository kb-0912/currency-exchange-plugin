import { 
    defineMiddlewares, 
    validateAndTransformBody,
    validateAndTransformQuery,
  } from "@medusajs/framework/http"
import { AdminGetCurrencyExchangeSettingParams } from "./admin/validators"
import { listAdminCurrencyExchangeQueryConfig } from "./admin/currency-exchange-settings/query-config"
  
  export default defineMiddlewares({
    routes: [
       {
        matcher: "/admin/currency-exchange-settings*",
        middlewares: [
          validateAndTransformQuery(
            AdminGetCurrencyExchangeSettingParams,
            listAdminCurrencyExchangeQueryConfig
          ),
        ],
      },
    ],
  })