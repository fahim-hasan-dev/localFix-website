"use client";

import { useEffect } from "react";
import { hydrate } from "@/redux/slices/authSlice";
import { hydrateMarketplace } from "@/redux/slices/marketplaceSlice";
import { hydrateIntake } from "@/redux/slices/intakeSlice";
import { hydrateFeatures } from "@/redux/slices/featuresSlice";
import { useAppDispatch } from "@/redux/hooks";

export function AuthHydration({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrate());
    dispatch(hydrateMarketplace());
    dispatch(hydrateIntake());
    dispatch(hydrateFeatures());
  }, [dispatch]);

  return children;
}
