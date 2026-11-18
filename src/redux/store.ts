import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "@/redux/slices/authSlice";
import filterReducer from "@/redux/slices/filterSlice";
import intakeReducer from "@/redux/slices/intakeSlice";
import marketplaceReducer from "@/redux/slices/marketplaceSlice";
import featuresReducer from "@/redux/slices/featuresSlice";
import { baseApi } from "@/services/client/base-api";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    filters: filterReducer,
    intake: intakeReducer,
    marketplace: marketplaceReducer,
    features: featuresReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
