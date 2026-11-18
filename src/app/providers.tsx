"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { AuthHydration } from "@/components/layout/auth-gate";
import { RealtimeSync } from "@/components/layout/realtime-sync";
import { antdTheme } from "@/lib/antd-theme";
import { store } from "@/redux/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AntdRegistry>
        <ConfigProvider theme={antdTheme}>
          <AuthHydration>{children}</AuthHydration>
          <RealtimeSync />
          <Toaster position="top-right" richColors closeButton />
        </ConfigProvider>
      </AntdRegistry>
    </Provider>
  );
}
