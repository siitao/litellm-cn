"use client";

import { ColumnFiltersState, OnChangeFn, PaginationState } from "@tanstack/react-table";
import { ScrollText } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

import { AuditLogEntry, getAuditLogsTableColumns } from "./AuditLogsTableColumns";

interface AuditLogsTableProps {
  data: AuditLogEntry[];
  rowCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  onRefresh: () => void;
  onViewLog: (log: AuditLogEntry) => void;
}

const ALL_VALUE = "all";

// Internal table name → i18n key (mirrors the column-builder mapping).
const TABLE_OPTION_LABEL_KEY: Record<string, string> = {
  LiteLLM_VerificationToken: "logs.table_keys",
  LiteLLM_TeamTable: "logs.table_teams",
  LiteLLM_UserTable: "logs.table_users",
  LiteLLM_OrganizationTable: "logs.table_organizations",
  LiteLLM_ProxyModelTable: "logs.table_models",
};

function AuditLogsEmptyState({ filtered }: { filtered: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <ScrollText className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {filtered ? t("logs.empty_no_match") : t("logs.empty_no_logs")}
      </div>
      <div className="max-w-xs text-center text-sm text-muted-foreground">
        {filtered ? t("logs.empty_no_match_desc") : t("logs.empty_no_logs_desc")}
      </div>
    </div>
  );
}

export function AuditLogsTable({
  data,
  rowCount,
  isLoading,
  isRefreshing,
  pagination,
  onPaginationChange,
  columnFilters,
  onColumnFiltersChange,
  onRefresh,
  onViewLog,
}: AuditLogsTableProps) {
  const { t } = useLanguage();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const actionOptions = useMemo(
    () => [
      { label: t("logs.action_created"), value: "created" },
      { label: t("logs.action_updated"), value: "updated" },
      { label: t("logs.action_deleted"), value: "deleted" },
      { label: t("logs.action_rotated"), value: "rotated" },
    ],
    [t],
  );

  const tableOptions = useMemo(
    () =>
      Object.entries(TABLE_OPTION_LABEL_KEY).map(([value, key]) => ({ label: t(key), value })),
    [t],
  );

  const filterLabels = useMemo<Record<string, string>>(
    () => ({
      object_id: t("logs.object_id"),
      changed_by: t("logs.changed_by"),
      team_id: t("logs.team_id"),
      key_hash: t("logs.key_hash"),
      action: t("logs.action"),
      table_name: t("logs.table"),
    }),
    [t],
  );

  const formatFilterValue = useCallback(
    (columnId: string, value: unknown): string => {
      const raw = String(value);
      if (columnId === "action") {
        return actionOptions.find((option) => option.value === raw)?.label ?? raw;
      }
      if (columnId === "table_name") {
        return tableOptions.find((option) => option.value === raw)?.label ?? raw;
      }
      return raw;
    },
    [actionOptions, tableOptions],
  );

  const columns = useMemo(() => getAuditLogsTableColumns({ onViewLog, t }), [onViewLog, t]);

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row) => row.id}
      paginationMode="server"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={rowCount}
      filterMode="server"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      isLoading={isLoading}
      loadingMessage={t("logs.loading")}
      noDataMessage={<AuditLogsEmptyState filtered={columnFilters.length > 0} />}
      size="compact"
      toolbar={(table) => (
        <>
          <DataTableToolbar
            table={table}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onOpenFilters={() => setFiltersOpen(true)}
            filterLabels={filterLabels}
            formatFilterValue={formatFilterValue}
            showViewOptions={false}
          />
          <DataTableFilterDrawer
            table={table}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={t("common.filters")}
            description={t("logs.filter_description")}
          >
            {({ get, set }) => (
              <>
                <DataTableFilterField label={t("logs.object_id")}>
                  <Input
                    value={(get("object_id") as string) ?? ""}
                    onChange={(event) => set("object_id", event.target.value)}
                    placeholder={t("logs.enter_object_id")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("logs.changed_by")}>
                  <Input
                    value={(get("changed_by") as string) ?? ""}
                    onChange={(event) => set("changed_by", event.target.value)}
                    placeholder={t("logs.enter_user_id")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("logs.team_id")}>
                  <Input
                    value={(get("team_id") as string) ?? ""}
                    onChange={(event) => set("team_id", event.target.value)}
                    placeholder={t("logs.enter_team_id")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("logs.key_hash")}>
                  <Input
                    value={(get("key_hash") as string) ?? ""}
                    onChange={(event) => set("key_hash", event.target.value)}
                    placeholder={t("logs.enter_key_hash")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("logs.action")}>
                  <Select
                    value={(get("action") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("action", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("logs.all_actions")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{t("logs.all_actions")}</SelectItem>
                      {actionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
                <DataTableFilterField label={t("logs.table")}>
                  <Select
                    value={(get("table_name") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("table_name", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("logs.all_tables")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{t("logs.all_tables")}</SelectItem>
                      {tableOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
              </>
            )}
          </DataTableFilterDrawer>
        </>
      )}
    />
  );
}
