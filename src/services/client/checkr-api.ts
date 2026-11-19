import { baseApi } from "@/services/client/base-api";
import { ENDPOINTS } from "@/services/endpoints";
import type { ApiResponse } from "@/types/api";

export type CheckrInvitationResult = {
  candidateId?: string | null;
  invitationId?: string | null;
  invitationUrl?: string | null;
  status?: string;
  invitationStatus?: string;
  package?: string;
  alreadyVerified?: boolean;
};

export type StartCheckrScreeningInput = {
  name: string;
  email: string;
  phone?: string;
  zipCode?: string;
  state?: string;
  consentAccepted: true;
};

export type CheckrStatusPayload = {
  backgroundCheck?: {
    status?: string;
    passed?: boolean;
    checkrInvitationUrl?: string | null;
    invitationStatus?: string;
    notes?: string | null;
  } | null;
  approvalStatus?: string;
};

function invitationFromUnknown(data: unknown): CheckrInvitationResult {
  if (!data || typeof data !== "object") return {};
  const record = data as Record<string, unknown>;
  return {
    candidateId: typeof record.candidateId === "string" ? record.candidateId : null,
    invitationId: typeof record.invitationId === "string" ? record.invitationId : null,
    invitationUrl:
      typeof record.invitationUrl === "string"
        ? record.invitationUrl
        : typeof record.checkrInvitationUrl === "string"
          ? record.checkrInvitationUrl
          : null,
    status: typeof record.status === "string" ? record.status : undefined,
    invitationStatus:
      typeof record.invitationStatus === "string" ? record.invitationStatus : undefined,
    package: typeof record.package === "string" ? record.package : undefined,
    alreadyVerified: record.alreadyVerified === true,
  };
}

export const checkrApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Logged-in pro: create/reuse Checkr hosted invitation. */
    initiateCheckrScreening: builder.mutation<
      ApiResponse<CheckrInvitationResult>,
      { forceNew?: boolean; consentAccepted?: boolean } | void
    >({
      query: (body) => ({
        url: ENDPOINTS.CHECKR.INITIATE,
        method: "POST",
        body: body ?? {},
      }),
      transformResponse: (response: ApiResponse<unknown>) => ({
        ...response,
        data: invitationFromUnknown(response.data),
      }),
      invalidatesTags: ["User"],
    }),

    /** Pre-signup: create invitation before account exists. */
    startCheckrScreening: builder.mutation<
      ApiResponse<CheckrInvitationResult>,
      StartCheckrScreeningInput
    >({
      query: (body) => ({
        url: ENDPOINTS.CHECKR.START_SCREENING,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<unknown>) => ({
        ...response,
        data: invitationFromUnknown(response.data),
      }),
    }),

    getMyCheckrStatus: builder.query<ApiResponse<CheckrStatusPayload>, { sync?: boolean } | void>({
      query: (args) => ({
        url: ENDPOINTS.CHECKR.STATUS,
        method: "GET",
        params: args?.sync ? { sync: "true" } : undefined,
      }),
      providesTags: ["User"],
    }),
  }),
});

export const {
  useInitiateCheckrScreeningMutation,
  useStartCheckrScreeningMutation,
  useGetMyCheckrStatusQuery,
  useLazyGetMyCheckrStatusQuery,
} = checkrApi;
