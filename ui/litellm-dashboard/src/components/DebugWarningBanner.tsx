"use client";

import React from "react";
import { Alert } from "antd";
import { useHealthReadinessDetails } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";

import { t } from "@/i18n";
interface DebugWarningBannerProps {
  accessToken: string | null;
}

export const DebugWarningBanner: React.FC<DebugWarningBannerProps> = ({ accessToken }) => {
  const { data: healthData } = useHealthReadinessDetails(accessToken);

  // Only show banner if detailed debug mode is explicitly enabled
  if (!healthData?.is_detailed_debug) {
    return null;
  }

  return (
    <Alert
      message={t("Performance Warning: Detailed Debug Mode Active")}
      description={
        <>{t("Detailed debug logging (")}<code>LITELLM_LOG=DEBUG</code>) is currently enabled. This mode logs extensive
          diagnostic information and will significantly degrade performance. It should only be used for troubleshooting
          and disabled in production environments.
        </>
      }
      type="warning"
      showIcon
      banner
      style={{ marginBottom: 0, borderRadius: 0 }}
    />
  );
};
