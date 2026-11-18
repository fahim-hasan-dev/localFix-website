import { baseApi } from "@/services/client/base-api";
import { jsonFormData } from "@/services/client/form-data";
import { ENDPOINTS } from "@/services/endpoints";
import type { ApiResponse } from "@/types/api";

export interface JobRequestInput {
  category: string;
  headline: string;
  description: string;
  timeframe?: string;
  serviceLocation?: {
    zipCode?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  professional?: string;
  preferredArrivalWindow?: string;
  propertyType?: string;
  partsAndMaterials?: string;
  estimatedBudget?: number;
  status?: string;
}

export interface JobListQuery {
  searchTerm?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyJobRequests: builder.query<ApiResponse<unknown>, { searchTerm?: string } | void>({
      query: (params) => ({
        url: ENDPOINTS.JOBS.MY_REQUESTS,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Jobs"],
    }),
    getJob: builder.query<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.JOBS.DETAIL(id), method: "GET" }),
      providesTags: ["Jobs"],
    }),
    createJob: builder.mutation<ApiResponse<unknown>, { data: JobRequestInput; projectPhotos?: File[] }>({
      query: ({ data, projectPhotos }) => ({
        url: ENDPOINTS.JOBS.LIST,
        method: "POST",
        body: jsonFormData(data, { projectPhotos }),
      }),
      invalidatesTags: ["Jobs"],
    }),
    updateJob: builder.mutation<ApiResponse<unknown>, { id: string; data: Partial<JobRequestInput>; projectPhotos?: File[] }>({
      query: ({ id, data, projectPhotos }) => ({
        url: ENDPOINTS.JOBS.DETAIL(id),
        method: "PATCH",
        body: jsonFormData(data, { projectPhotos }),
      }),
      invalidatesTags: ["Jobs"],
    }),
    deleteJobRequest: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.JOBS.DETAIL(id), method: "DELETE" }),
      invalidatesTags: ["Jobs"],
    }),
    getMarketplaceLeads: builder.query<ApiResponse<unknown>, JobListQuery | void>({
      query: (params) => ({
        url: ENDPOINTS.JOBS.MARKETPLACE_LEADS,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Jobs"],
    }),
    getMarketplaceLead: builder.query<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.JOBS.MARKETPLACE_LEAD(id), method: "GET" }),
      providesTags: ["Jobs"],
    }),
    rejectMarketplaceLead: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.JOBS.REJECT_LEAD(id), method: "DELETE" }),
      invalidatesTags: ["Jobs"],
    }),
    getDirectRequests: builder.query<ApiResponse<unknown>, JobListQuery | void>({
      query: (params) => ({
        url: ENDPOINTS.JOBS.DIRECT_REQUESTS,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Jobs"],
    }),
    getDirectRequest: builder.query<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.JOBS.DIRECT_REQUEST(id), method: "GET" }),
      providesTags: ["Jobs"],
    }),
    rejectDirectRequest: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.JOBS.REJECT_DIRECT(id), method: "DELETE" }),
      invalidatesTags: ["Jobs"],
    }),
    getJobTabsCount: builder.query<ApiResponse<unknown>, void>({
      query: () => ({ url: ENDPOINTS.JOBS.TABS_COUNT, method: "GET" }),
      providesTags: ["Jobs"],
    }),
    getMyProposals: builder.query<ApiResponse<unknown>, JobListQuery | void>({
      query: (params) => ({
        url: ENDPOINTS.JOBS.MY_PROPOSALS,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Jobs", "Quotes"],
    }),
  }),
});

export const {
  useGetMyJobRequestsQuery,
  useGetJobQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobRequestMutation,
  useGetMarketplaceLeadsQuery,
  useGetMarketplaceLeadQuery,
  useRejectMarketplaceLeadMutation,
  useGetDirectRequestsQuery,
  useGetDirectRequestQuery,
  useRejectDirectRequestMutation,
  useGetJobTabsCountQuery,
  useGetMyProposalsQuery,
} = jobsApi;
