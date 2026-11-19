import type { FetchBaseQueryMeta } from "@reduxjs/toolkit/query";
import { baseApi } from "@/services/client/base-api";
import { ENDPOINTS } from "@/services/endpoints";
import { authToken, normalizeRole } from "@/utils/authToken";
import { mediaUrl } from "@/utils/mediaUrl";
import { login, logout } from "@/redux/slices/authSlice";
import type { ApiResponse } from "@/types/api";
import type {
  AuthResponseData,
  LoginRequest,
  SignupRequest,
  VerifyEmailRequest,
  ForgetPasswordRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
  BackendUser,
} from "@/types/auth";
import type { User } from "@/types";

function readToken(value: unknown, depth = 0): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object" || depth > 4) return "";
  const record = value as Record<string, unknown>;
  return (
    readToken(record.resetToken, depth + 1) ||
    readToken(record.token, depth + 1) ||
    readToken(record.accessToken, depth + 1) ||
    readToken(record.data, depth + 1)
  );
}

function extractResetToken(payload: unknown, headerToken?: string | null): string {
  const fromHeader = headerToken?.trim();
  if (fromHeader) return fromHeader;
  if (typeof payload === "string") return payload.trim();
  if (!payload || typeof payload !== "object") return "";

  const body = payload as Record<string, unknown>;
  return readToken(body.data) || readToken(body.resetToken) || readToken(body.token);
}

function extractAuthUser(authData?: AuthResponseData | null): BackendUser | null {
  if (!authData) return null;
  // Live API nests the user under `data`; older shapes used `user`.
  const candidate = authData.user || authData.data;
  if (!candidate || typeof candidate !== "object") return null;
  if (!candidate.email && !candidate._id && !candidate.id && !candidate.role) return null;
  return candidate;
}

function mapBackendUserToFrontend(backendUser: BackendUser): User {
  const role = normalizeRole(backendUser.role);
  const id = backendUser._id || backendUser.id || "";

  return {
    id,
    name: backendUser.name || (role === "pro" ? "Professional" : "Homeowner"),
    email: backendUser.email,
    role,
    phone: backendUser.phone,
    zip: backendUser.zipCode,
    avatar: mediaUrl(backendUser.profileImage),
    city: backendUser.city,
    state: backendUser.state,
    street: backendUser.streetAddress,
  };
}

function persistSession(
  dispatch: (action: ReturnType<typeof login>) => void,
  authData?: AuthResponseData | null,
) {
  const token = authData?.token || authData?.accessToken;
  const refreshToken = authData?.refreshToken;
  const backendUser = extractAuthUser(authData);
  if (!token || !backendUser) return null;
  if (backendUser.verified === false) return null;

  const user = mapBackendUserToFrontend(backendUser);
  authToken.setTokens({
    accessToken: token,
    refreshToken,
    role: user.role,
  });
  dispatch(login(user));
  return user;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthResponseData>, LoginRequest>({
      query: (credentials) => ({
        url: ENDPOINTS.AUTH.LOGIN,
        method: "POST",
        body: credentials,
      }),
      // Do not invalidate User here — a parallel /profile refetch can 401 and clear
      // the brand-new session (login → bounce back to /login).
      invalidatesTags: ["Auth"],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          persistSession(dispatch, response.data);
        } catch {
          // Handled by calling component
        }
      },
    }),

    signup: builder.mutation<ApiResponse<AuthResponseData>, SignupRequest>({
      query: (signupData) => ({
        url: ENDPOINTS.AUTH.SIGNUP,
        method: "POST",
        body: signupData,
      }),
      invalidatesTags: ["Auth"],
      transformResponse: (response: ApiResponse<AuthResponseData>) => {
        // Explicitly strip any token returned from signup so it is never accessible or stored
        if (response?.data) {
          return {
            ...response,
            data: {
              ...response.data,
              token: undefined,
              accessToken: undefined,
              refreshToken: undefined,
            },
          };
        }
        return response;
      },
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        authToken.clearTokens();
        dispatch(logout());
        try {
          await queryFulfilled;
          authToken.clearTokens();
          dispatch(logout());
        } catch {
          // Handled by calling component
        }
      },
    }),

    verifyEmail: builder.mutation<ApiResponse<AuthResponseData>, VerifyEmailRequest>({
      query: (data) => ({
        url: ENDPOINTS.AUTH.VERIFY_EMAIL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth", "User"],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          persistSession(dispatch, response.data);
        } catch {
          // Handled by caller
        }
      },
    }),

    resendOtp: builder.mutation<ApiResponse<{ message?: string }>, ResendOtpRequest>({
      query: (data) => ({
        url: ENDPOINTS.AUTH.RESEND_OTP,
        method: "POST",
        body: data,
      }),
    }),

    forgetPassword: builder.mutation<ApiResponse<{ message?: string }>, ForgetPasswordRequest>({
      query: (data) => ({
        url: ENDPOINTS.AUTH.FORGET_PASSWORD,
        method: "POST",
        body: data,
      }),
    }),

    verifyResetOtp: builder.mutation<{ resetToken: string; message?: string }, VerifyEmailRequest>({
      query: (data) => ({
        url: ENDPOINTS.AUTH.VERIFY_EMAIL,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ApiResponse<unknown> | string, meta: FetchBaseQueryMeta) => ({
        resetToken: extractResetToken(response, meta.response?.headers.get("resettoken")),
        message:
          response && typeof response === "object" && typeof response.message === "string"
            ? response.message
            : undefined,
      }),
    }),

    resetPassword: builder.mutation<
      ApiResponse<{ message?: string }>,
      { data: ResetPasswordRequest; resetToken: string }
    >({
      query: ({ data, resetToken }) => ({
        url: ENDPOINTS.AUTH.RESET_PASSWORD,
        method: "POST",
        headers: {
          resettoken: resetToken,
        },
        body: data,
      }),
    }),

    getMe: builder.query<ApiResponse<BackendUser>, void>({
      // Backend has no /auth/me — profile endpoint is the session user source.
      query: () => ({
        url: ENDPOINTS.USERS.PROFILE,
        method: "GET",
      }),
      providesTags: ["User"],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          if (response.data) {
            const user = mapBackendUserToFrontend(response.data);
            dispatch(login(user));
          }
        } catch {
          // Handled by RTK Query
        }
      },
    }),

    logoutUser: builder.mutation<void, void>({
      query: () => ({
        url: ENDPOINTS.AUTH.LOGOUT,
        method: "POST",
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          authToken.clearTokens();
          dispatch(logout());
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useVerifyEmailMutation,
  useResendOtpMutation,
  useForgetPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLogoutUserMutation,
} = authApi;
