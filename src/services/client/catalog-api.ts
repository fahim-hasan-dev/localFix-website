import { baseApi } from "@/services/client/base-api";
import { ENDPOINTS } from "@/services/endpoints";
import type { ApiResponse } from "@/types/api";
import type { ApiCategory, ApiProfessional } from "@/lib/api-mappers";

export interface ListMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPage?: number;
}

export interface ProfessionalQuery {
  page?: number;
  limit?: number;
  searchTerm?: string;
  category?: string;
  location?: string;
  city?: string;
  zipCode?: string;
  minBudget?: number;
  maxBudget?: number;
  minRating?: number;
  sortBy?: string;
}

export interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  role?: string;
  order?: number;
}

export interface RuleContent {
  _id?: string;
  content?: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PackageItem {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  monthlyPrice?: number;
  yearlyPrice?: number;
  billingCycle?: string;
  features?: string[];
  isPopular?: boolean;
  isActive?: boolean;
  hasTrial?: boolean;
  trialDays?: number;
  leadLimit?: number;
}

export interface MarqueeItem {
  _id: string;
  keyword: string;
  isEnabled?: boolean;
  order?: number;
}

export interface BannerContent {
  _id?: string;
  headline?: string;
  description?: string;
  image?: string;
}

export interface SiteSettings {
  _id?: string;
  platformBrandName?: string;
  headerLogo?: string;
  footerLogo?: string;
  favicon?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}

interface ListResponse<T> extends ApiResponse<T> {
  meta?: ListMeta;
}

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<ApiResponse<ApiCategory[]>, void>({
      query: () => ({ url: ENDPOINTS.CATEGORIES.LIST, method: "GET" }),
      providesTags: ["Categories"],
    }),
    getCategory: builder.query<ApiResponse<ApiCategory>, string>({
      query: (id) => ({ url: ENDPOINTS.CATEGORIES.DETAIL(id), method: "GET" }),
      providesTags: ["Categories"],
    }),
    getProfessionals: builder.query<ListResponse<ApiProfessional[]>, ProfessionalQuery | void>({
      query: (params) => ({
        url: ENDPOINTS.PROFESSIONALS.LIST,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Pros"],
    }),
    getTopRatedProfessionals: builder.query<ListResponse<ApiProfessional[]>, { limit?: number } | void>({
      query: (params) => ({
        url: ENDPOINTS.PROFESSIONALS.TOP_RATED,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Pros"],
    }),
    getProfessional: builder.query<ApiResponse<ApiProfessional>, string>({
      query: (id) => ({ url: ENDPOINTS.PROFESSIONALS.DETAIL(id), method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Pros", id }],
    }),
    getProfessionalsByCategory: builder.query<ListResponse<ApiProfessional[]>, string>({
      query: (categoryId) => ({
        url: ENDPOINTS.SERVICES.PROFESSIONALS,
        method: "GET",
        params: { categoryId },
      }),
      providesTags: ["Pros"],
    }),
    getFaqs: builder.query<ApiResponse<FaqItem[]>, { role?: string } | void>({
      query: (params) => ({
        url: ENDPOINTS.FAQS,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Faqs"],
    }),
    getRule: builder.query<ApiResponse<RuleContent>, string>({
      query: (type) => ({ url: ENDPOINTS.RULES(type), method: "GET" }),
      providesTags: ["Rules"],
    }),
    sendContact: builder.mutation<ApiResponse<{ message?: string }>, ContactRequest>({
      query: (body) => ({
        url: ENDPOINTS.CONTACT,
        method: "POST",
        body,
      }),
    }),
    getPackages: builder.query<ApiResponse<PackageItem[]>, { billingCycle?: string; isActive?: boolean } | void>({
      query: (params) => ({
        url: ENDPOINTS.PACKAGES,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Packages"],
    }),
    getMarquees: builder.query<ApiResponse<MarqueeItem[]>, void>({
      query: () => ({ url: ENDPOINTS.MARQUEES, method: "GET" }),
      providesTags: ["Marquees"],
    }),
    getBanners: builder.query<ApiResponse<BannerContent | BannerContent[]>, void>({
      query: () => ({ url: ENDPOINTS.BANNERS, method: "GET" }),
      providesTags: ["Banners"],
    }),
    getSiteSettings: builder.query<ApiResponse<SiteSettings>, void>({
      query: () => ({ url: ENDPOINTS.SITE_SETTINGS, method: "GET" }),
      providesTags: ["SiteSettings"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useGetProfessionalsQuery,
  useGetTopRatedProfessionalsQuery,
  useGetProfessionalQuery,
  useGetProfessionalsByCategoryQuery,
  useGetFaqsQuery,
  useGetRuleQuery,
  useSendContactMutation,
  useGetPackagesQuery,
  useGetMarqueesQuery,
  useGetBannersQuery,
  useGetSiteSettingsQuery,
} = catalogApi;
