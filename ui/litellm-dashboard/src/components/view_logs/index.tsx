import { useState } from "react";
import useCan from "@/app/(dashboard)/hooks/useCan";
import DeletedKeysPage from "../DeletedKeysPage/DeletedKeysPage";
import DeletedTeamsPage from "../DeletedTeamsPage/DeletedTeamsPage";
import AuditLogsPanel from "./AuditLogsPanel";
import RequestLogsPanel from "./RequestLogsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/i18n";

interface SpendLogsTableProps {
  accessToken: string | null;
  token: string | null;
  userRole: string | null;
  userID: string | null;
  premiumUser: boolean;
}

type LogsTabId = "request logs" | "audit logs" | "deleted keys" | "deleted teams";

interface LogsTab {
  id: LogsTabId;
  label: string;
}

const REQUEST_LOGS_TAB: LogsTab = { id: "request logs", label: t("Request Logs")};
const AUDIT_LOGS_TAB: LogsTab = { id: "audit logs", label: t("Audit Logs")};
const DELETED_KEYS_TAB: LogsTab = { id: "deleted keys", label: t("Deleted Keys")};
const DELETED_TEAMS_TAB: LogsTab = { id: "deleted teams", label: t("Deleted Teams")};

export default function SpendLogsTable({ accessToken, token, userRole, userID, premiumUser }: SpendLogsTableProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<LogsTabId>(REQUEST_LOGS_TAB.id);
  const canViewAuditLogs = useCan("viewAuditLogs");
  const canViewDeletedTeams = useCan("viewDeletedTeams");

  if (!accessToken || !token || !userRole || !userID) {
    return (
      <div role="status" aria-busy="true" aria-label={t("common.loading")} className="flex h-64 items-center justify-center">
        <UiLoadingSpinner className="size-8 text-primary" />
      </div>
    );
  }

  const tabLabel = (id: LogsTabId): string => {
    switch (id) {
      case "request logs":
        return t("request_logs.tab_request_logs");
      case "audit logs":
        return t("request_logs.tab_audit_logs");
      case "deleted keys":
        return t("request_logs.tab_deleted_keys");
      case "deleted teams":
        return t("request_logs.tab_deleted_teams");
    }
  };

  const tabs: LogsTab[] = [
    { ...REQUEST_LOGS_TAB, label: tabLabel(REQUEST_LOGS_TAB.id) },
    ...(canViewAuditLogs ? [{ ...AUDIT_LOGS_TAB, label: tabLabel(AUDIT_LOGS_TAB.id) }] : []),
    { ...DELETED_KEYS_TAB, label: tabLabel(DELETED_KEYS_TAB.id) },
    ...(canViewDeletedTeams ? [{ ...DELETED_TEAMS_TAB, label: tabLabel(DELETED_TEAMS_TAB.id) }] : []),
  ];

  const renderPanel = (tabId: LogsTabId) => {
    switch (tabId) {
      case "request logs":
        return (
          <RequestLogsPanel
            accessToken={accessToken}
            token={token}
            userRole={userRole}
            userID={userID}
            isActive={activeTab === "request logs"}
          />
        );
      case "audit logs":
        return (
          <AuditLogsPanel
            userID={userID}
            userRole={userRole}
            token={token}
            accessToken={accessToken}
            isActive={activeTab === "audit logs"}
            premiumUser={premiumUser}
          />
        );
      case "deleted keys":
        return <DeletedKeysPage />;
      case "deleted teams":
        return <DeletedTeamsPage />;
    }
  };

  return (
    <div className="box-border w-full overflow-x-hidden p-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogsTabId)}>
        <TabsList variant="line">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-none">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} keepMounted>
            {renderPanel(tab.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
