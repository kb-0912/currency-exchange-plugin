// src/modules/currency-exchange/exchange-rate.ts
import { MedusaService } from "@medusajs/framework/utils";
import { CurrencyExchangeSettings } from "./models/currency-exchange-settings";

type CurrencyExchangeOptions = {
  apiKey?: string;
  apiUrl?: string;
};

class CurrencyExchangeService extends MedusaService({
  CurrencyExchangeSettings,
}) {
  protected options: CurrencyExchangeOptions;

  constructor(container, options) {
    super(...arguments);
    this.options = options;
  }

  async getExchangeRates(baseCurrency) {
    try {
      // Format the API URL with the base currency
      const apiUrl = `https://latest.currency-api.pages.dev/v1/currencies/${baseCurrency.toLowerCase()}.json`;

      // Make the request to the Currency API
      const response = await fetch(apiUrl);

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();

      // Get API rates
      const apiRates = data[baseCurrency.toLowerCase()];

      // Get manual settings
      // const manualSettings = await this.listCurrencyExchangeSettings({
      //   mode: "manual"
      // })

      // Override API rates with manual rates where applicable
      const rates = { ...apiRates };

      return rates;
    } catch (error) {
      throw new Error(`Failed to fetch exchange rates: ${error.message}`);
    }
  }
}

export default CurrencyExchangeService;
