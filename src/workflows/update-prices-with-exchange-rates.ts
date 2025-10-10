// src/workflows/update-prices-with-exchange-rates.ts
import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { batchProductVariantsWorkflow } from "@medusajs/medusa/core-flows";
import { CURRENCY_EXCHANGE_MODULE } from "../modules/currency-exchange";
import CurrencyExchangeService from "../modules/currency-exchange/service";

// Define types for better TypeScript support
// type StoreType = {
//   supported_currencies: Array<{
//     code: string;
//     is_default: boolean;
//     currency_code: string;
//   }>;
// };

type ProductType = {
  id: string;
  variants: Array<{
    id: string;
    prices: Array<{
      id?: string;
      amount: number;
      currency_code: string;
    }>;
  }>;
};

// Step 1: Get store details including supported currencies
const getStoreDetailsStep = createStep(
  "get-store-details",
  async (_input, { container }) => {
    const queryService = container.resolve<any>("query");
    const { data: stores } = await queryService.graph({
      entity: "store",
      fields: ["supported_currencies.*"],
    });
    return new StepResponse({ stores }); // Ensure the correct field is returned
  }
);

// Step 2: Get all products with their variants and prices
const getProductsStep = createStep(
  "get-products",
  async (_input, { container }) => {
    const queryService = container.resolve<any>("query");
    const { data: products } = await queryService.graph({
      entity: "product",
      fields: ["id", "variants.id", "variants.prices.*"],
    });
    return new StepResponse({ products });
  }
);

// Step 3: Get exchange rates and enabled currencies
const getExchangeRatesStep = createStep(
  "get-exchange-rates",
  async (input: { baseCurrency: string }, { container }) => {
    const currencyExchangeService: CurrencyExchangeService = container.resolve(
      CURRENCY_EXCHANGE_MODULE
    );

    // 1. Fetch rates from provider
    const apiRates = await currencyExchangeService.getExchangeRates(
      input.baseCurrency
    );
    // 2. Fetch all currency exchange settings (manual + auto)
    const allSettings =
      await currencyExchangeService.listCurrencyExchangeSettings({});

    // 3. Build merged rates: manual override, auto use api
    const mergedRates: Record<string, number> = {};
    const enabledCurrencies: string[] = [];

    for (const setting of allSettings) {
      const code = setting.currency_code.toLowerCase();
      // Only get settings with status "enable"
      if (setting.status === "enable") {
        enabledCurrencies.push(code);
        if (setting.mode === "manual") {
          mergedRates[code] = setting.exchange_rate;
        } else if (
          setting.mode === "auto" &&
          typeof apiRates[code] === "number"
        ) {
          mergedRates[code] = apiRates[code];
        }
      }
      // Disable: skip
    }

    // Ensure base currency is always present (if not, add it with rate = 1)
    if (!enabledCurrencies.includes(input.baseCurrency)) {
      enabledCurrencies.push(input.baseCurrency);
      mergedRates[input.baseCurrency] = 1;
    }

    return new StepResponse({
      rates: mergedRates,
      enabledCurrencies,
    });
  }
);

// Step 4: Prepare variant updates for batchProductVariantsWorkflow
const prepareVariantUpdatesStep = createStep(
  "prepare-variant-updates",
  async (input: {
    products: ProductType[];
    rates: Record<string, number>;
    enabledCurrencies: string[];
    defaultCurrency: string;
  }) => {
    const { products, rates, enabledCurrencies, defaultCurrency } = input;

    const updates: Array<{
      id: string;
      prices: Array<{ id?: string; amount: number; currency_code: string }>;
    }> = [];

    products.forEach((product) => {
      product.variants.forEach((variant) => {
        // Get base price (default currency price)
        const basePrice = variant.prices.find(
          (price) => price.currency_code?.toLowerCase() === defaultCurrency
        );
        if (!basePrice) return; // If no base price, skip

        // --- CALCULATE NEW PRICES for enabled currencies ---
        const variantPrices: Array<{
          id?: string;
          amount: number;
          currency_code: string;
        }> = [];
        let enoughPrices = true;

        enabledCurrencies.forEach((currencyCode) => {
          if (!currencyCode) return; // skip empty

          let amount: number | undefined = undefined;
          if (currencyCode === defaultCurrency) {
            amount = basePrice.amount;
          } else {
            const exchangeRate = rates[currencyCode];
            if (typeof exchangeRate !== "number" || exchangeRate <= 0) {
              enoughPrices = false;
              return;
            }
            amount = Math.round(basePrice.amount * exchangeRate);
          }

          if (typeof amount !== "number" || amount <= 0) {
            enoughPrices = false;
            return;
          }

          const existingPrice = variant.prices.find(
            (price) => price.currency_code?.toLowerCase() === currencyCode
          );
          variantPrices.push({
            id: existingPrice?.id,
            amount,
            currency_code: currencyCode,
          });
        });

        if (enoughPrices && variantPrices.length === enabledCurrencies.length) {
          // --- ADD OLD PRICES OF DISABLED CURRENCIES (DON'T TOUCH THEM) ---
          const keepOldPrices = variant.prices.filter(
            (price) =>
              !enabledCurrencies.includes(price.currency_code?.toLowerCase())
          );
          const allPrices = [...variantPrices, ...keepOldPrices];

          // Push update including both new prices (enabled) and old prices (disabled ones are kept)
          updates.push({
            id: variant.id,
            prices: allPrices,
          });
        }
      });
    });

    //console.log("[DEBUG] Updates to apply:", JSON.stringify(updates, null, 2));
    return new StepResponse({ updates });
  }
);

// Main workflow
export const updatePricesWithExchangeRates = createWorkflow(
  "update-prices-with-exchange-rates",
  function () {
    const { stores } = getStoreDetailsStep();
    const { products } = getProductsStep();

    const defaultCurrency = transform({ stores }, (data) => {
      if (!data.stores || !data.stores[0]) throw new Error("No store found");
      const found = data.stores[0].supported_currencies.find(
        (currency: any) => currency.is_default === true
      );
      if (!found) throw new Error("No default currency in store");
      return found.currency_code.toLowerCase();
    });

    const { rates, enabledCurrencies } = getExchangeRatesStep({
      baseCurrency: defaultCurrency,
    });

    const { updates } = prepareVariantUpdatesStep({
      products,
      rates,
      enabledCurrencies,
      defaultCurrency,
    });

    batchProductVariantsWorkflow.runAsStep({
      input: { update: updates },
    });

    return new WorkflowResponse({
      success: true,
      updatedVariantCount: transform(
        { updates },
        (data) => data.updates.length
      ),
      message:
        "Product variant prices updated successfully based on exchange rates",
    });
  }
);
