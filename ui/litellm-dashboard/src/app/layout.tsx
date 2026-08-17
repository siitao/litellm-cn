import type { Metadata } from "next";
import "./globals.css";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import AntdGlobalProvider from "@/contexts/AntdGlobalProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ReactQueryProvider from "@/contexts/ReactQueryProvider";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t("LiteLLM Dashboard"),
  description: t("LiteLLM Proxy Admin UI"),
  icons: { icon: "/get_favicon" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>
        <NuqsAdapter>
          <ReactQueryProvider>
            <AntdGlobalProvider>
              <LanguageProvider>
                <AuthProvider>{children}</AuthProvider>
              </LanguageProvider>
            </AntdGlobalProvider>
          </ReactQueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
