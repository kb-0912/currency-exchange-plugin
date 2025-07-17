import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/sdk-extensions/currency-exchange"
import {
  AdminCurrencyExchangeQueryParams,
  AdminCurrencyExchangeSettingsResponse,
  AdminCurrencyExchangeSettingResponse,
  AdminUpdateCurrencyExchangeSettingRequest,
  AdminEnableCurrencyExchangeSettingRequest,
} from "../types/currency-exchange"



// 1. Lấy danh sách settings (có hỗ trợ filter)
export const useCurrencyExchangeSettings = (
  queryParams: AdminCurrencyExchangeQueryParams = {}
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["currency-exchange-settings", "list", queryParams],
    queryFn: async () => {
      const response = await sdk.admin.currencyExchangeSettings.list(queryParams)
      return response as AdminCurrencyExchangeSettingsResponse
    },
  })

  return {
    settings: data?.settings || [],
    count: data?.count || 0,
    isLoading,
    error,
  }
}

// 2. Lấy 1 setting theo id
export const useCurrencyExchangeSetting = (
  id: string,
  queryParams = {}
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["currency-exchange-setting", id, queryParams],
    queryFn: async () => {
      const response = await sdk.admin.currencyExchangeSettings.retrieve(id, queryParams)
      return response as AdminCurrencyExchangeSettingResponse
    },
    enabled: !!id,
  })

  return {
    setting: data?.setting,
    isLoading,
    error,
  }
}

// 3. Enable 1 currency (tạo mới)
export const useEnableCurrencyExchangeSetting = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AdminEnableCurrencyExchangeSettingRequest) => {
      return await sdk.admin.currencyExchangeSettings.enable(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currency-exchange-settings", "list"] })
    },
  })
}

// 4. Update exchange rate hoặc mode
export const useUpdateCurrencyExchangeSetting = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: AdminUpdateCurrencyExchangeSettingRequest & { id: string }) => {
      return await sdk.admin.currencyExchangeSettings.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["currency-exchange-setting", id] })
      queryClient.invalidateQueries({ queryKey: ["currency-exchange-settings", "list"] })
    },
  })
}

// 5. (Optional) Disable currency exchange (nếu có api hỗ trợ)
export const useDisableCurrencyExchangeSetting = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: AdminUpdateCurrencyExchangeSettingRequest & { id: string }) => {
      return await sdk.admin.currencyExchangeSettings.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["currency-exchange-setting", id] })
      queryClient.invalidateQueries({ queryKey: ["currency-exchange-settings", "list"] })
    },
  })
}

export const useTriggerCurrencyUpdate = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/admin/currency-exchange-settings/update-currency-rates", { method: "POST" })
      if (!res.ok) throw new Error("Update failed")
      return res.json()
    },
  })
}