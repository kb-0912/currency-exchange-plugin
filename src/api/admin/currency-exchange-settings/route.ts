import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Get list of currency codes from store
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["supported_currencies.*"],
  });
  const supported = stores[0]?.supported_currencies || [];
  const baseCurrency = supported.find((c: any) => c.is_default)?.currency_code;

  // Get settings for currency codes
  const { data: settings } = await query.graph({
    entity: "currency_exchange_settings",
    fields: [
      "id",
      "currency_code",
      "status",
      "exchange_rate",
      "mode",
      "created_at",
      "updated_at",
    ],
  });

  // Merge supported currencies with settings
  const merged = (supported || [])
    .filter(
      (cur: any) =>
        !!cur && !!cur.currency_code && cur.currency_code !== baseCurrency
    )
    .map((cur: any) => {
      const found = settings.find(
        (s: any) => s.currency_code === cur.currency_code
      );
      return {
        currency_code: cur.currency_code,
        exchange_rate: found?.exchange_rate ?? 1,
        mode: found?.mode ?? "auto",
        status: found?.status ?? "disable",
        id: found?.id ?? null,
        created_at: found?.created_at ?? null,
        updated_at: found?.updated_at ?? null,
      };
    });

  res.json({ settings: merged });
};
