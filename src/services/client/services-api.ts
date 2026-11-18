import { baseApi } from "@/services/client/base-api";
import { ENDPOINTS } from "@/services/endpoints";
import type { ApiResponse } from "@/types/api";
import type { ApiService } from "@/lib/api-mappers";

export interface ServiceInput {
  name: string;
  category: string;
  description: string;
}

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyServices: builder.query<ApiResponse<ApiService[]>, { searchTerm?: string } | void>({
      query: (params) => ({
        url: ENDPOINTS.SERVICES.LIST,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Services"],
    }),
    getService: builder.query<ApiResponse<ApiService>, string>({
      query: (id) => ({ url: ENDPOINTS.SERVICES.DETAIL(id), method: "GET" }),
      providesTags: ["Services"],
    }),
    createService: builder.mutation<ApiResponse<ApiService>, ServiceInput>({
      query: (body) => ({
        url: ENDPOINTS.SERVICES.LIST,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Services", "Pros"],
    }),
    updateService: builder.mutation<ApiResponse<ApiService>, ServiceInput & { id: string }>({
      query: ({ id, ...body }) => ({
        url: ENDPOINTS.SERVICES.DETAIL(id),
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Services", "Pros"],
    }),
    deleteService: builder.mutation<ApiResponse<{ message?: string }>, string>({
      query: (id) => ({
        url: ENDPOINTS.SERVICES.DETAIL(id),
        method: "DELETE",
      }),
      invalidatesTags: ["Services", "Pros"],
    }),
  }),
});

export const {
  useGetMyServicesQuery,
  useGetServiceQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = servicesApi;
