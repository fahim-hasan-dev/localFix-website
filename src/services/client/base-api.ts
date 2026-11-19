import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { baseUrl } from "@/utils/baseUrl";
import { authToken } from "@/utils/authToken";
import { ENDPOINTS } from "@/services/endpoints";
import { logout } from "@/redux/slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { endpoint }) => {
    // Reset password authenticates with the OTP reset token header, not the session.
    if (endpoint !== "resetPassword") {
      const token = authToken.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    headers.set("Accept", "application/json");
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const requestUrl = typeof args === "string" ? args : args.url;
    const isAuthRoute =
      requestUrl.includes(ENDPOINTS.AUTH.LOGIN) ||
      requestUrl.includes(ENDPOINTS.AUTH.REFRESH) ||
      requestUrl.includes(ENDPOINTS.AUTH.SIGNUP) ||
      requestUrl.includes(ENDPOINTS.AUTH.FORGET_PASSWORD) ||
      requestUrl.includes(ENDPOINTS.AUTH.VERIFY_EMAIL) ||
      requestUrl.includes(ENDPOINTS.AUTH.RESET_PASSWORD) ||
      requestUrl.includes(ENDPOINTS.AUTH.RESEND_OTP);

    if (!isAuthRoute) {
      const refreshToken = authToken.getRefreshToken();
      if (refreshToken) {
        // Attempt token refresh
        const refreshResult = await rawBaseQuery(
          {
            url: ENDPOINTS.AUTH.REFRESH,
            method: "POST",
            body: { refreshToken },
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
          api,
          extraOptions,
        );

        const data = refreshResult.data as
          | { success?: boolean; data?: { token?: string; accessToken?: string }; token?: string; accessToken?: string }
          | undefined;

        const newAccessToken =
          data?.data?.accessToken || data?.data?.token || data?.accessToken || data?.token;

        if (newAccessToken) {
          authToken.setTokens({ accessToken: newAccessToken });
          // Retry original request with the new access token
          result = await rawBaseQuery(args, api, extraOptions);
        } else if (authToken.getAccessToken()) {
          // Keep the existing session if refresh payload is empty — avoid wiping a
          // just-established login because of a flaky refresh response.
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          authToken.clearTokens();
          api.dispatch(logout());
        }
      }
      // No refresh token: leave the session alone. A single 401 (e.g. permission)
      // must not force logout and bounce the user back to /login.
    }
  }

  return result;
};

export const TAG_TYPES = [
  "Auth",
  "User",
  "Jobs",
  "Quotes",
  "Bookings",
  "Categories",
  "Pros",
  "Notifications",
  "Messages",
  "Services",
  "Favorites",
  "Chats",
  "Support",
  "Subscriptions",
  "Packages",
  "Reviews",
  "Faqs",
  "Rules",
  "Marquees",
  "Banners",
  "SiteSettings",
] as const;

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});
