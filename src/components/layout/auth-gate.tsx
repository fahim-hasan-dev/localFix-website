"use client";

import { useEffect } from "react";
import { hydrate } from "@/redux/slices/authSlice";
import { hydrateMarketplace } from "@/redux/slices/marketplaceSlice";
import { hydrateIntake } from "@/redux/slices/intakeSlice";
import { hydrateFeatures } from "@/redux/slices/featuresSlice";
import { useAppDispatch } from "@/redux/hooks";
import { useLazyGetMeQuery } from "@/services/client/auth-api";
import { authToken } from "@/utils/authToken";

export function AuthHydration({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [fetchMe] = useLazyGetMeQuery();

  useEffect(() => {
    dispatch(hydrate());
    dispatch(hydrateMarketplace());
    dispatch(hydrateIntake());
    dispatch(hydrateFeatures());

    // Refresh the session user from the API when a real token exists (skip the demo token).
    const token = authToken.getAccessToken();
    if (token && token !== "demo-token") {
      void fetchMe(undefined, true);
    }
  }, [dispatch, fetchMe]);

  return children;
}
