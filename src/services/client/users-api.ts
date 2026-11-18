import { baseApi } from "@/services/client/base-api";
import { jsonFormData } from "@/services/client/form-data";
import { ENDPOINTS } from "@/services/endpoints";
import type { ApiResponse } from "@/types/api";

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProjectPhotoInput {
  title: string;
  category: string;
  image?: File | null;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<ApiResponse<Record<string, unknown>>, void>({
      query: () => ({ url: ENDPOINTS.USERS.PROFILE, method: "GET" }),
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation<
      ApiResponse<Record<string, unknown>>,
      { data: Record<string, unknown>; profileImage?: File | null; tradeLicenseCertificate?: File | null; coiCertificate?: File | null }
    >({
      query: ({ data, profileImage, tradeLicenseCertificate, coiCertificate }) => ({
        url: ENDPOINTS.USERS.UPDATE,
        method: "PATCH",
        body: jsonFormData(data, { profileImage, tradeLicenseCertificate, coiCertificate }),
      }),
      invalidatesTags: ["User", "Pros"],
    }),
    changePassword: builder.mutation<ApiResponse<{ message?: string }>, ChangePasswordRequest>({
      query: (body) => ({
        url: ENDPOINTS.AUTH.CHANGE_PASSWORD,
        method: "POST",
        body,
      }),
    }),
    deleteMyAccount: builder.mutation<ApiResponse<{ message?: string }>, { password: string }>({
      query: (body) => ({
        url: ENDPOINTS.USERS.PROFILE,
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    uploadProjectPhoto: builder.mutation<ApiResponse<Record<string, unknown>>, ProjectPhotoInput>({
      query: ({ title, category, image }) => ({
        url: ENDPOINTS.USERS.PROJECT_PHOTOS,
        method: "POST",
        body: jsonFormData({ title, category }, { image }),
      }),
      invalidatesTags: ["User", "Pros"],
    }),
    updateProjectPhoto: builder.mutation<ApiResponse<Record<string, unknown>>, ProjectPhotoInput & { photoId: string }>({
      query: ({ photoId, title, category, image }) => ({
        url: ENDPOINTS.USERS.PROJECT_PHOTO(photoId),
        method: "PATCH",
        body: jsonFormData({ title, category }, { image }),
      }),
      invalidatesTags: ["User", "Pros"],
    }),
    deleteProjectPhoto: builder.mutation<ApiResponse<{ message?: string }>, string>({
      query: (photoId) => ({
        url: ENDPOINTS.USERS.PROJECT_PHOTO(photoId),
        method: "DELETE",
      }),
      invalidatesTags: ["User", "Pros"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useDeleteMyAccountMutation,
  useUploadProjectPhotoMutation,
  useUpdateProjectPhotoMutation,
  useDeleteProjectPhotoMutation,
} = usersApi;
