import { baseApi } from "@/services/client/base-api";
import { ENDPOINTS } from "@/services/endpoints";
import type { ApiResponse } from "@/types/api";

export interface QuotationInput {
  jobRequest: string;
  priceType: "fixed" | "estimate" | "hourly" | "timeandmaterials";
  totalRate: number;
  scopeOfWork: string;
  exclusions?: string;
  partsAndMaterialsIncluded?: string;
  estimatedDuration?: string;
  earliestAvailableDate?: string;
  arrivalTimeWindow?: string;
  warranty?: string;
  offerValidUntil?: string;
  additionalNotes?: string;
}

export interface AcceptQuotationInput {
  id: string;
  appointmentDate: string;
  paymentMethod: string;
  arrivalTimeWindow: string;
}

export interface BookingTab {
  tab?: "history" | "active_on_site" | "upcoming" | "all";
  searchTerm?: string;
}

export interface RescheduleBookingInput {
  id: string;
  appointmentDate: string;
  arrivalTimeWindow: string;
  paymentMethod?: string;
}

export interface ConfirmCompletionInput {
  id: string;
  paymentMethod: string;
  isPaidDirectly: boolean;
  isSatisfactionConfirmed: boolean;
}

export interface ReviewInput {
  bookingId: string;
  rating: number;
  feedback: string;
}

export interface ReviewQuery {
  tab?: "all" | "needs_reply" | "replied";
  rating?: number;
  searchTerm?: string;
}

export const marketplaceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendQuotation: builder.mutation<ApiResponse<unknown>, QuotationInput>({
      query: (body) => ({ url: ENDPOINTS.QUOTATIONS.LIST, method: "POST", body }),
      invalidatesTags: ["Quotes", "Jobs"],
    }),
    getQuotation: builder.query<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.QUOTATIONS.DETAIL(id), method: "GET" }),
      providesTags: ["Quotes"],
    }),
    acceptQuotation: builder.mutation<ApiResponse<unknown>, AcceptQuotationInput>({
      query: ({ id, ...body }) => ({
        url: ENDPOINTS.QUOTATIONS.ACCEPT(id),
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Quotes", "Bookings", "Jobs"],
    }),
    declineQuotation: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.QUOTATIONS.DECLINE(id), method: "DELETE" }),
      invalidatesTags: ["Quotes", "Jobs"],
    }),
    getMyBookings: builder.query<ApiResponse<unknown>, BookingTab | void>({
      query: (params) => ({
        url: ENDPOINTS.BOOKINGS.MINE,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Bookings"],
    }),
    getBooking: builder.query<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.BOOKINGS.DETAIL(id), method: "GET" }),
      providesTags: ["Bookings"],
    }),
    markBookingOnTheWay: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.BOOKINGS.ON_THE_WAY(id), method: "PATCH" }),
      invalidatesTags: ["Bookings", "Jobs"],
    }),
    startBookingWork: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.BOOKINGS.START_WORK(id), method: "PATCH" }),
      invalidatesTags: ["Bookings", "Jobs"],
    }),
    completeBookingWork: builder.mutation<ApiResponse<unknown>, { id: string; completionNote: string }>({
      query: ({ id, completionNote }) => ({
        url: ENDPOINTS.BOOKINGS.COMPLETE_WORK(id),
        method: "PATCH",
        body: { completionNote },
      }),
      invalidatesTags: ["Bookings", "Jobs"],
    }),
    rescheduleBooking: builder.mutation<ApiResponse<unknown>, RescheduleBookingInput>({
      query: ({ id, ...body }) => ({
        url: ENDPOINTS.BOOKINGS.RESCHEDULE(id),
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Bookings", "Jobs"],
    }),
    cancelBooking: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.BOOKINGS.CANCEL(id), method: "DELETE" }),
      invalidatesTags: ["Bookings", "Jobs"],
    }),
    confirmBookingCompletion: builder.mutation<ApiResponse<unknown>, ConfirmCompletionInput>({
      query: ({ id, ...body }) => ({
        url: ENDPOINTS.BOOKINGS.CONFIRM_COMPLETION(id),
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Bookings", "Jobs", "Reviews"],
    }),
    verifyBookingPayment: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.BOOKINGS.VERIFY_PAYMENT(id), method: "GET" }),
      invalidatesTags: ["Bookings", "Jobs"],
    }),
    createReview: builder.mutation<ApiResponse<unknown>, ReviewInput>({
      query: (body) => ({ url: ENDPOINTS.REVIEWS.LIST, method: "POST", body }),
      invalidatesTags: ["Reviews", "Pros", "Bookings"],
    }),
    getMyReviews: builder.query<ApiResponse<unknown>, ReviewQuery | void>({
      query: (params) => ({
        url: ENDPOINTS.REVIEWS.MINE,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Reviews"],
    }),
    replyToReview: builder.mutation<ApiResponse<unknown>, { id: string; reply: string }>({
      query: ({ id, reply }) => ({
        url: ENDPOINTS.REVIEWS.REPLY(id),
        method: "PATCH",
        body: { reply },
      }),
      invalidatesTags: ["Reviews"],
    }),
    deleteReviewReply: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.REVIEWS.REPLY(id), method: "DELETE" }),
      invalidatesTags: ["Reviews"],
    }),
    getProfessionalAnalytics: builder.query<ApiResponse<unknown>, { period?: string; year?: number; month?: number } | void>({
      query: (params) => ({
        url: ENDPOINTS.PROFESSIONALS.ANALYTICS,
        method: "GET",
        params: params || undefined,
      }),
    }),
    getProfessionalHistory: builder.query<ApiResponse<unknown>, { period?: string; year?: number; month?: number } | void>({
      query: (params) => ({
        url: ENDPOINTS.PROFESSIONALS.HISTORY,
        method: "GET",
        params: params || undefined,
      }),
    }),
    getProfessionalApplication: builder.query<ApiResponse<unknown>, void>({
      query: () => ({ url: ENDPOINTS.PROFESSIONALS.APPLICATION, method: "GET" }),
      providesTags: ["User"],
    }),
  }),
});

export const {
  useSendQuotationMutation,
  useGetQuotationQuery,
  useAcceptQuotationMutation,
  useDeclineQuotationMutation,
  useGetMyBookingsQuery,
  useGetBookingQuery,
  useMarkBookingOnTheWayMutation,
  useStartBookingWorkMutation,
  useCompleteBookingWorkMutation,
  useRescheduleBookingMutation,
  useCancelBookingMutation,
  useConfirmBookingCompletionMutation,
  useVerifyBookingPaymentMutation,
  useCreateReviewMutation,
  useGetMyReviewsQuery,
  useReplyToReviewMutation,
  useDeleteReviewReplyMutation,
  useGetProfessionalAnalyticsQuery,
  useGetProfessionalHistoryQuery,
  useGetProfessionalApplicationQuery,
} = marketplaceApi;
