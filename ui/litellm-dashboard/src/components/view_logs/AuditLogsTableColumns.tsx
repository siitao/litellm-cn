"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DateCell, IdCell, IdentityCell, StatusBadge, type StatusTone } from "@/components/shared/table_cells";
import { TFunction } from "@/i18n";

import DefaultProxyAdminTag from "../common_components/DefaultProxyAdminTag";

export type AuditLogEntry = {
  id: string;
  updated_at: string;
  changed_by: string;
  changed_by_api_key: string;
  action: string;
  table_name: string;
  object_id: string;
  before_value: Record<string, unknown>;
  updated_values: Record<string, unknown>;
};

// Internal table name → i18n key for the human-readable display name.
const TABLE_NAME_LABEL_KEY: Record<string, string> = {
  LiteLLM_VerificationToken: "logs.table_keys",
  LiteLLM_TeamTable: "logs.table_teams",
  LiteLLM_UserTable: "logs.table_users",
  LiteLLM_OrganizationTable: "logs.table_organizations",
  LiteLLM_ProxyModelTable: "logs.table_models",
};

// English display names, kept as the canonical mapping for consumers that render
// outside the LanguageContext (e.g. the audit log drawer).
export const AUDIT_TABLE_NAME_DISPLAY: Record<string, string> = {
  LiteLLM_VerificationToken: "Keys",
  LiteLLM_TeamTable: "Teams",
  LiteLLM_UserTable: "Users",
  LiteLLM_OrganizationTable: "Organizations",
  LiteLLM_ProxyModelTable: "Models",
};

const tableNameLabel = (tableName: string, t: TFunction): string =>
  TABLE_NAME_LABEL_KEY[tableName] ? t(TABLE_NAME_LABEL_KEY[tableName]) : tableName;

const ACTION_TONE: Record<string, StatusTone> = {
  created: "success",
  updated: "info",
  deleted: "error",
  rotated: "warning",
};

const ACTION_LABEL_KEY: Record<string, string> = {
  created: "logs.action_created",
  updated: "logs.action_updated",
  deleted: "logs.action_deleted",
  rotated: "logs.action_rotated",
};

const actionLabel = (action: string, t: TFunction): string =>
  ACTION_LABEL_KEY[action] ? t(ACTION_LABEL_KEY[action]) : capitalize(action);

const capitalize = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

interface AuditLogsTableColumnsDeps {
  onViewLog: (log: AuditLogEntry) => void;
  t: TFunction;
}

export const getAuditLogsTableColumns = ({ onViewLog, t }: AuditLogsTableColumnsDeps): ColumnDef<AuditLogEntry>[] => [
  {
    id: "updated_at",
    accessorKey: "updated_at",
    header: t("logs.timestamp"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.updated_at} />,
  },
  {
    id: "action",
    accessorKey: "action",
    header: t("logs.action"),
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge tone={ACTION_TONE[row.original.action] ?? "neutral"} label={actionLabel(row.original.action, t)} />
    ),
  },
  {
    id: "table_name",
    accessorKey: "table_name",
    header: t("logs.table"),
    size: 130,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{tableNameLabel(row.original.table_name, t)}</span>
    ),
  },
  {
    id: "object_id",
    accessorKey: "object_id",
    header: t("logs.object_id"),
    minSize: 220,
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.object_id}
        titleClassName="font-mono text-xs font-normal text-primary"
        className="max-w-72"
        onClick={() => onViewLog(row.original)}
      />
    ),
  },
  {
    id: "changed_by",
    accessorKey: "changed_by",
    header: t("logs.changed_by"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <DefaultProxyAdminTag userId={row.original.changed_by} />,
  },
  {
    id: "changed_by_api_key",
    accessorKey: "changed_by_api_key",
    header: t("logs.api_key_hash"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.changed_by_api_key} variant="plain" />,
  },
];
