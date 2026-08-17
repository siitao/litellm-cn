import { DateRangePickerValue } from "@tremor/react";
import { TFunction } from "@/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import React, { useEffect, useState } from "react";
import NotificationsManager from "@/components/molecules/notifications_manager";
import UsageDatePicker from "@/components/shared/usage_date_picker";
import { BarChart } from "@/components/shared/charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RefreshCw } from "lucide-react";
import { cachingHealthCheckCall } from "@/components/networking";
import { useCacheActivity, type CacheActivityGroup } from "@/app/(dashboard)/hooks/caching/useCacheActivity";

// Import the new component
import { CacheHealthTab } from "./cache_health";
import CacheSettings from "./cache_settings";
import CoordinationRedisSettings from "./coordination_redis_settings";

const REQUEST_SERIES = (t: TFunction) => ({
  apiRequests: t("caching.series_api_requests"),
  cacheHits: t("caching.series_cache_hit"),
  failed: t("caching.series_failed"),
} as const);

const toChartDatum = (group: CacheActivityGroup, t: TFunction) => ({
  name: group.call_type,
  [REQUEST_SERIES(t).apiRequests]: group.api_requests,
  [REQUEST_SERIES(t).cacheHits]: group.cache_hits,
  [REQUEST_SERIES(t).failed]: group.failed_requests,
  "Cached Completion Tokens": group.cached_completion_tokens,
  "Generated Completion Tokens": group.generated_completion_tokens,
});

const formatDateWithoutTZ = (date: Date | undefined) => {
  if (!date) return undefined;
  return date.toISOString().split("T")[0];
};

function valueFormatterNumbers(number: number) {
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    notation: "compact",
    compactDisplay: "short",
  });

  return formatter.format(number);
}

interface CachePageProps {
  accessToken: string | null;
  token: string | null;
  userRole: string | null;
  userID: string | null;
  premiumUser: boolean;
}

// Helper function to deep-parse a JSON string if possible

const CacheDashboard: React.FC<CachePageProps> = ({ accessToken, token, userRole, userID, premiumUser }) => {
  const { t } = useLanguage();
  const [selectedApiKeys, setSelectedApiKeys] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const [dateValue, setDateValue] = useState<DateRangePickerValue>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const [lastRefreshed, setLastRefreshed] = useState("");
  const [healthCheckResponse, setHealthCheckResponse] = useState<any>("");

  const { data: activity, refetch } = useCacheActivity({
    startDate: formatDateWithoutTZ(dateValue.from),
    endDate: formatDateWithoutTZ(dateValue.to),
    keyAliases: selectedApiKeys,
    models: selectedModels,
  });

  useEffect(() => {
    setLastRefreshed(new Date().toLocaleString());
  }, []);

  const uniqueApiKeys = activity?.filter_options.key_aliases ?? [];
  const uniqueModels = activity?.filter_options.models ?? [];
  const chartData = (activity?.groups ?? []).map((g) => toChartDatum(g, t));

  const handleRefreshClick = () => {
    refetch();
    setLastRefreshed(new Date().toLocaleString());
  };

  const runCachingHealthCheck = async () => {
    try {
      NotificationsManager.info("Running cache health check...");
      setHealthCheckResponse("");
      const response = await cachingHealthCheckCall(accessToken !== null ? accessToken : "");
      setHealthCheckResponse(response);
    } catch (error: any) {
      console.error(t("Error running health check:"), error);
      let errorData;
      if (error && error.message) {
        try {
          // Parse the error message which may contain a nested error layer.
          let parsedData = JSON.parse(error.message);
          // If the parsed object is wrapped (e.g. { error: { ... } }), unwrap it.
          if (parsedData.error) {
            parsedData = parsedData.error;
          }
          errorData = parsedData;
        } catch (e) {
          errorData = { message: error.message };
        }
      } else {
        errorData = { message: "Unknown error occurred" };
      }
      setHealthCheckResponse({ error: errorData });
    }
  };

  const totals = activity?.totals;
  const hasRequests = totals != null && totals.api_requests + totals.cache_hits + totals.failed_requests > 0;
  const statCards = [
    { label: t("caching.stat_hit_ratio"), value: `${hasRequests ? totals.cache_hit_ratio.toFixed(2) : "0"}%` },
    { label: t("caching.stat_hits"), value: valueFormatterNumbers(totals?.cache_hits ?? 0) },
    { label: t("caching.stat_cached_tokens"), value: valueFormatterNumbers(totals?.cached_completion_tokens ?? 0) },
  ];

  return (
    <Tabs defaultValue="analytics" className="mt-2 mb-8 w-full gap-2 p-8">
      <div className="mt-2 flex w-full items-center justify-between">
        <TabsList>
          <TabsTrigger value="analytics" className="flex-none">
            {t("caching.tab_analytics")}
          </TabsTrigger>
          <TabsTrigger value="health" className="flex-none">
            {t("caching.tab_health")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-none">
            {t("caching.tab_settings")}
          </TabsTrigger>
          <TabsTrigger value="coordination" className="flex-none">
            {t("caching.tab_coordination")}
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center space-x-2">
          {lastRefreshed && <p className="text-sm text-muted-foreground">{t("common.last_refreshed").replace("{time}", lastRefreshed)}</p>}
          <Button variant="outline" size="icon-sm" onClick={handleRefreshClick} aria-label={t("Refresh")}>
            <RefreshCw />
          </Button>
        </div>
      </div>

      <TabsContent value="analytics">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("Analytics for LiteLLM&apos;s")}{" "}
              <a
                href="https://docs.litellm.ai/docs/proxy/caching"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >{t("response cache")}</a>{" "}
              (e.g. Redis / in-memory): requests answered from cache without calling the LLM provider. Provider-side{" "}
              <a
                href="https://docs.litellm.ai/docs/completion/prompt_caching"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >{t("prompt caching")}</a>{" "}
              (cached input tokens from Anthropic, OpenAI, etc.) is not shown here; see &quot;Prompt Caching
              Metrics&quot; on the Usage page or individual requests in the Logs page.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Combobox
                multiple
                items={uniqueApiKeys}
                value={selectedApiKeys}
                onValueChange={(keys: string[]) => setSelectedApiKeys(keys)}
              >
                <ComboboxChips>
                  <ComboboxValue>
                    {(keys: string[]) =>
                      keys.map((key) => (
                        <ComboboxChip key={key} aria-label={key}>
                          {key}
                        </ComboboxChip>
                      ))
                    }
                  </ComboboxValue>
                  <ComboboxChipsInput placeholder={t("caching.select_virtual_keys")} className="border-0 bg-transparent" />
                </ComboboxChips>
                <ComboboxContent>
                  <ComboboxEmpty>{t("caching.no_virtual_keys")}</ComboboxEmpty>
                  <ComboboxList>
                    {(key: string) => (
                      <ComboboxItem key={key} value={key}>
                        {key}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              <Combobox
                multiple
                items={uniqueModels}
                value={selectedModels}
                onValueChange={(models: string[]) => setSelectedModels(models)}
              >
                <ComboboxChips>
                  <ComboboxValue>
                    {(models: string[]) =>
                      models.map((model) => (
                        <ComboboxChip key={model} aria-label={model}>
                          {model}
                        </ComboboxChip>
                      ))
                    }
                  </ComboboxValue>
                  <ComboboxChipsInput placeholder={t("caching.select_models")} className="border-0 bg-transparent" />
                </ComboboxChips>
                <ComboboxContent>
                  <ComboboxEmpty>{t("caching.no_models")}</ComboboxEmpty>
                  <ComboboxList>
                    {(model: string) => (
                      <ComboboxItem key={model} value={model}>
                        {model}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              <UsageDatePicker
                value={dateValue}
                onValueChange={(value) => {
                  setDateValue(value);
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((stat) => (
                <Card key={stat.label}>
                  <CardContent>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <div className="mt-2 flex items-baseline space-x-2.5">
                      <p className="text-3xl font-semibold">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base font-semibold">{t("caching.chart_hits_vs_requests")}</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={chartData}
                  stack={true}
                  index="name"
                  valueFormatter={valueFormatterNumbers}
                  categories={[REQUEST_SERIES(t).apiRequests, REQUEST_SERIES(t).cacheHits, REQUEST_SERIES(t).failed]}
                  colors={["sky", "teal", "red"]}
                  yAxisWidth={48}
                />
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {t("caching.chart_cached_vs_generated")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={chartData}
                  stack={true}
                  index="name"
                  valueFormatter={valueFormatterNumbers}
                  categories={["Generated Completion Tokens", "Cached Completion Tokens"]}
                  colors={["sky", "teal"]}
                  yAxisWidth={48}
                />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="health">
        <CacheHealthTab
          accessToken={accessToken}
          healthCheckResponse={healthCheckResponse}
          runCachingHealthCheck={runCachingHealthCheck}
        />
      </TabsContent>

      <TabsContent value="settings">
        <CacheSettings accessToken={accessToken} userRole={userRole} userID={userID} />
      </TabsContent>

      <TabsContent value="coordination">
        <CoordinationRedisSettings />
      </TabsContent>
    </Tabs>
  );
};

export default CacheDashboard;
