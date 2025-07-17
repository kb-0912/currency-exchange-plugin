import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollarSolid } from "@medusajs/icons"
import {
  Container,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  Heading,
  Toaster,
  useDataTable,
  Badge,
  Switch,
  Button,
  toast,
} from "@medusajs/ui"
import { useState, useEffect } from "react"
import {
  useCurrencyExchangeSettings,
  useEnableCurrencyExchangeSetting,
  useDisableCurrencyExchangeSetting,
  useUpdateCurrencyExchangeSetting,
  useTriggerCurrencyUpdate,
} from "../../hooks/currency-exchange"
import { AdminCurrencyExchangeSetting, ExchangeRateMode, ExchangeRateStatus } from "../../types/currency-exchange"

export const config = defineRouteConfig({
  label: "Currency Exchange",
  icon: CurrencyDollarSolid,
})

const columnHelper = createDataTableColumnHelper<AdminCurrencyExchangeSetting>()

export default function CurrencyExchangeSettingsPage() {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 15,
    pageIndex: 0,
  })

  const {
    settings = [],
    count = 0,
    isLoading,
    error,
  } = useCurrencyExchangeSettings({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    order: "-created_at",
  })

  const enableMutation = useEnableCurrencyExchangeSetting()
  const disableMutation = useDisableCurrencyExchangeSetting()
  const updateMutation = useUpdateCurrencyExchangeSetting()
  const triggerUpdateMutation = useTriggerCurrencyUpdate()

  const [editRate, setEditRate] = useState<{ [id: string]: string }>({})

  // Auto-sync editRate với rate mới nhất khi reload/refetch data
  useEffect(() => {
    if (!settings) return
    const nextEditRate: { [id: string]: string } = {}
    settings.forEach(s => {
      if (s.id && s.mode === ExchangeRateMode.MANUAL) {
        nextEditRate[s.id] = ""
      }
    })
    setEditRate(nextEditRate)
  }, [settings])

  const columns = [
    columnHelper.accessor("currency_code", {
      header: "Currency",
      cell: ({ getValue }) => getValue().toUpperCase(),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <Badge color={value === "enable" ? "green" : "blue"}>
            {value === "enable" ? "Enabled" : "Disabled"}
          </Badge>
        )
      },
    }),
    columnHelper.accessor("mode", {
      header: "Mode",
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <Badge color={value === "manual" ? "orange" : "green"}>
            {value === "manual" ? "Manual" : "Auto"}
          </Badge>
        )
      },
    }),
    columnHelper.accessor("exchange_rate", {
      header: "Exchange Rate",
      cell: ({ getValue }) => getValue(),
    }),
    columnHelper.display({
      id: "action",
      header: "Action",
      cell: ({ row }) => {
        const setting = row.original
        return (
          <Switch
            checked={setting.status === "enable"}
            onCheckedChange={checked => {
              if (checked) {
                enableMutation.mutate(
                  { currency_code: setting.currency_code },
                  {
                    onError: (e: any) => toast.error("Enable failed", { description: e?.message }),
                    onSuccess: () => toast.success("Enabled!"),
                  }
                )
              } else if (setting.id) {
                // Gọi PATCH để update status: "disable"
                disableMutation.mutate(
                  { id: setting.id, status:  ExchangeRateStatus.DISABLE },
                  {
                    onError: (e: any) => toast.error("Disable failed", { description: e?.message }),
                    onSuccess: () => toast.success("Disabled!"),
                  }
                )
              }
            }}
            aria-label={`Enable/disable exchange for ${setting.currency_code}`}
            disabled={enableMutation.isPending || disableMutation.isPending}
          />
          
        )
      },
    }),
    columnHelper.display({
      id: "config",
      header: "Config",
      cell: ({ row }) => {
        const setting = row.original

        if (setting.status !== "enable") return null

        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={setting.mode === "manual"}
              onCheckedChange={checked => {
                updateMutation.mutate(
                  { id: setting.id!, mode: checked ? ExchangeRateMode.MANUAL : ExchangeRateMode.AUTO },
                  {
                    onSuccess: () => toast.success(`Switched to ${checked ? "manual" : "auto"} mode!`),
                    onError: (e: any) => toast.error("Switch failed", { description: e?.message }),
                  }
                )
              }}
              aria-label={`Switch to ${setting.mode === "manual" ? "Auto" : "Manual"} mode`}
              disabled={updateMutation.isPending}
            />
            <span className="text-xs text-gray-500">
              {setting.mode === "manual" ? "Manual" : "Auto"}
            </span>

            {setting.mode === "manual" ? (
              <>
                <input
                  type="number"
                  value={
                    editRate[setting.id!]?.length
                      ? editRate[setting.id!]
                      : String(setting.exchange_rate ?? "")
                  }
                  onChange={e =>
                    setEditRate(r => ({
                      ...r,
                      [setting.id!]: e.target.value,
                    }))
                  }
                  className="border p-1 rounded w-24"
                />
                <Button
                  size="small"
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate(
                      {
                        id: setting.id!,
                        exchange_rate: Number(
                          editRate[setting.id!] || setting.exchange_rate
                        ),
                      },
                      {
                        onSuccess: () => {
                          toast.success("Updated rate!")
                          // Clear only if đã đổi
                          setEditRate(r => ({
                            ...r,
                            [setting.id!]: "",
                          }))
                        },
                        onError: (e: any) =>
                          toast.error("Update failed", {
                            description: e?.message,
                          }),
                      }
                    )
                  }
                >
                  Save
                </Button>
              </>
            ) : (
              <span className="text-xs text-gray-700">Rate: {setting.exchange_rate}</span>
            )}
          </div>
        )
      },
    }),
  ]

  const table = useDataTable({
    columns,
    data: settings,
    getRowId: (row) => row.currency_code,
    rowCount: count,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  if (isLoading) return <div>Loading…</div>
  if (error) return <div>Error loading data: {error.message || JSON.stringify(error)}</div>

  return (
    <>
      <Container className="flex flex-col p-0 overflow-hidden">
        <Heading className="p-6 font-sans flex items-center justify-between font-medium h1-core">
          Currency Exchange Settings
          <Button
            size="small"
            disabled={triggerUpdateMutation.isPending}
            onClick={() =>
              triggerUpdateMutation.mutate(undefined, {
                onSuccess: () => toast.success("Update prices with exchange rate sucessfully!"),
                onError: (e: any) => toast.error("Error while update prices!", { description: e?.message }),
              })
            }
          >
            {triggerUpdateMutation.isPending ? "Updating..." : "Update Prices Now"}
          </Button>
        </Heading>
        
        <div className="">
          
          <DataTable instance={table}>
            <DataTable.Table />
            <DataTable.Pagination />
          </DataTable>
        </div>
      </Container>
      
      <Toaster />
    </>
  )
}