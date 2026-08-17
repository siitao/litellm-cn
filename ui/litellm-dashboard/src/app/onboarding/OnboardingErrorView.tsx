import React from "react";
import { Alert, Button } from "antd";
import { getLoginUrl } from "@/utils/returnUrlUtils";

import { t } from "@/i18n";
export function OnboardingErrorView() {
  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Alert
        type="error"
        message={t("Failed to load invitation")}
        description={t("The invitation link may be invalid or expired.")}
        showIcon
      />
      <div className="mt-4">
        <Button href={getLoginUrl()}>{t("Back to Login")}</Button>
      </div>
    </div>
  );
}
