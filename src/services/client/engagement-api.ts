import { useMemo } from "react";
import { baseApi } from "@/services/client/base-api";
import { jsonFormData } from "@/services/client/form-data";
import { ENDPOINTS } from "@/services/endpoints";
import { useAppSelector } from "@/redux/hooks";
import type { ApiResponse } from "@/types/api";
import type { AppNotification } from "@/redux/slices/featuresSlice";
import type { ApiProfessional } from "@/lib/api-mappers";
import { unwrapChats } from "@/lib/marketplace-mappers";

const NOTIFICATION_PAGE_SIZE = 20;

type NotificationListResponse = ApiResponse<Record<string, unknown>[]> & {
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPage?: number;
    unreadCount?: number;
  };
};

export interface SupportTicketInput {
  subject: string;
  description: string;
  priority?: string;
  relatedJobId?: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterRole?: string;
}

export interface SubscriptionCheckoutInput {
  packageId: string;
  planType: "monthly" | "yearly";
}

function referenceId(raw: Record<string, unknown>): string {
  const value = raw.referenceId;
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id?: unknown })._id || "");
  }
  return "";
}

function notificationHref(raw: Record<string, unknown>, role: "homeowner" | "pro"): string {
  const explicit = raw.href || raw.link || raw.url;
  if (typeof explicit === "string" && explicit.startsWith("/")) return explicit;
  const model = String(raw.referenceModel || "").toLowerCase();
  const title = `${raw.title || ""} ${raw.text || raw.body || ""}`.toLowerCase();
  const id = referenceId(raw);
  const pro = role === "pro";
  const aboutBooking =
    model === "booking" ||
    title.includes("booking") ||
    title.includes("appointment") ||
    title.includes("reschedul") ||
    title.includes("on the way") ||
    title.includes("on-site") ||
    title.includes("work completion") ||
    title.includes("work started");
  if (aboutBooking) {
    if (id) return pro ? `/pro/bookings/${id}` : `/account/bookings/${id}`;
    return pro ? "/pro/bookings" : "/account/bookings";
  }
  if (model === "jobrequest" && id) return pro ? `/pro/jobs/${id}` : `/account/jobs/${id}`;
  if (model === "jobrequest") return pro ? "/pro/jobs" : "/account/jobs";
  if (model === "quotation") return pro ? "/pro/jobs" : "/account/jobs";
  if (model === "review") return pro ? "/pro/reviews" : "/account";
  if (model === "subscription" || model === "package") return pro ? "/pro/pricing" : "/account";
  if (model === "user") return pro ? "/pro/profile" : "/account/profile";
  return pro ? "/pro/notifications" : "/account/notifications";
}

function formatWhen(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapNotification(
  raw: Record<string, unknown>,
  index: number,
  role: "homeowner" | "pro",
): AppNotification {
  return {
    id: String(raw._id || raw.id || index),
    title: String(raw.title || raw.subject || "Notification"),
    body: String(raw.text || raw.body || raw.message || raw.description || ""),
    href: notificationHref(raw, role),
    createdAt: formatWhen(String(raw.createdAt || "")),
    read: Boolean(raw.read ?? raw.isRead),
    role: "all",
  };
}

export const engagementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.infiniteQuery<NotificationListResponse, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const page = Number(lastPage.meta?.page || lastPageParam);
          const totalPage = Number(lastPage.meta?.totalPage || 0);
          if (totalPage > 0) return page < totalPage ? page + 1 : undefined;
          const count = Array.isArray(lastPage.data) ? lastPage.data.length : 0;
          return count < NOTIFICATION_PAGE_SIZE ? undefined : lastPageParam + 1;
        },
      },
      query: ({ pageParam }) => ({
        url: ENDPOINTS.NOTIFICATIONS.LIST,
        method: "GET",
        params: { page: pageParam, limit: NOTIFICATION_PAGE_SIZE },
      }),
      providesTags: ["Notifications"],
    }),
    getNotification: builder.query<ApiResponse<Record<string, unknown>>, string>({
      query: (id) => ({ url: ENDPOINTS.NOTIFICATIONS.DETAIL(id), method: "GET" }),
    }),
    readAllNotifications: builder.mutation<ApiResponse<{ message?: string }>, void>({
      query: () => ({ url: ENDPOINTS.NOTIFICATIONS.READ_ALL, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    readNotification: builder.mutation<ApiResponse<{ message?: string }>, string>({
      query: (id) => ({ url: ENDPOINTS.NOTIFICATIONS.READ(id), method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    getFavorites: builder.query<ApiResponse<unknown>, void>({
      query: () => ({ url: ENDPOINTS.FAVORITES.LIST, method: "GET" }),
      providesTags: ["Favorites"],
    }),
    toggleFavorite: builder.mutation<ApiResponse<unknown>, { id: string }>({
      query: (body) => ({
        url: ENDPOINTS.FAVORITES.TOGGLE,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Favorites", "Pros"],
    }),
    getChats: builder.query<ApiResponse<unknown>, { searchTerm?: string } | void>({
      query: (params) => ({
        url: ENDPOINTS.CHATS.LIST,
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Chats"],
    }),
    createChat: builder.mutation<ApiResponse<unknown>, { participant: string }>({
      query: (body) => ({
        url: ENDPOINTS.CHATS.CREATE,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Chats"],
    }),
    markChatRead: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.CHATS.READ(id), method: "PATCH" }),
      invalidatesTags: ["Chats"],
    }),
    deleteChat: builder.mutation<ApiResponse<unknown>, string>({
      query: (chatId) => ({ url: ENDPOINTS.CHATS.DELETE(chatId), method: "DELETE" }),
      invalidatesTags: ["Chats", "Messages"],
    }),
    getMessages: builder.query<ApiResponse<unknown>, { chatId: string; page?: number; limit?: number }>({
      query: ({ chatId, page, limit }) => ({
        url: ENDPOINTS.MESSAGES.LIST(chatId),
        method: "GET",
        params: { page, limit },
      }),
      providesTags: ["Messages"],
    }),
    sendMessage: builder.mutation<ApiResponse<unknown>, { chatId: string; text: string; image?: File | null }>({
      query: ({ chatId, text, image }) => ({
        url: ENDPOINTS.MESSAGES.SEND(chatId),
        method: "POST",
        body: jsonFormData({ text }, { image }),
      }),
      invalidatesTags: ["Messages", "Chats"],
    }),
    deleteMessage: builder.mutation<ApiResponse<unknown>, string>({
      query: (messageId) => ({ url: ENDPOINTS.MESSAGES.DELETE(messageId), method: "DELETE" }),
      invalidatesTags: ["Messages"],
    }),
    getSupportTickets: builder.query<ApiResponse<unknown>, void>({
      query: () => ({ url: ENDPOINTS.SUPPORT.LIST, method: "GET" }),
      providesTags: ["Support"],
    }),
    getSupportTicket: builder.query<ApiResponse<unknown>, string>({
      query: (id) => ({ url: ENDPOINTS.SUPPORT.DETAIL(id), method: "GET" }),
      providesTags: ["Support"],
    }),
    createSupportTicket: builder.mutation<ApiResponse<unknown>, SupportTicketInput>({
      query: (body) => ({ url: ENDPOINTS.SUPPORT.LIST, method: "POST", body }),
      invalidatesTags: ["Support"],
    }),
    replySupportTicket: builder.mutation<ApiResponse<unknown>, { id: string; message: string }>({
      query: ({ id, message }) => ({
        url: ENDPOINTS.SUPPORT.REPLY(id),
        method: "POST",
        body: { message },
      }),
      invalidatesTags: ["Support"],
    }),
    getMySubscription: builder.query<ApiResponse<unknown>, void>({
      query: () => ({ url: ENDPOINTS.SUBSCRIPTIONS.MINE, method: "GET" }),
      providesTags: ["Subscriptions"],
    }),
    checkoutSubscription: builder.mutation<ApiResponse<unknown>, SubscriptionCheckoutInput>({
      query: (body) => ({ url: ENDPOINTS.SUBSCRIPTIONS.CHECKOUT, method: "POST", body }),
      invalidatesTags: ["Subscriptions"],
    }),
    updateSubscriptionPlan: builder.mutation<ApiResponse<unknown>, SubscriptionCheckoutInput>({
      query: (body) => ({ url: ENDPOINTS.SUBSCRIPTIONS.UPDATE_PLAN, method: "POST", body }),
      invalidatesTags: ["Subscriptions"],
    }),
    cancelUpcomingPlan: builder.mutation<ApiResponse<unknown>, void>({
      query: () => ({ url: ENDPOINTS.SUBSCRIPTIONS.CANCEL_UPCOMING, method: "DELETE" }),
      invalidatesTags: ["Subscriptions"],
    }),
    cancelSubscription: builder.mutation<ApiResponse<unknown>, void>({
      query: () => ({ url: ENDPOINTS.SUBSCRIPTIONS.CANCEL, method: "DELETE" }),
      invalidatesTags: ["Subscriptions"],
    }),
    openBillingPortal: builder.mutation<ApiResponse<unknown>, void>({
      query: () => ({ url: ENDPOINTS.SUBSCRIPTIONS.PORTAL, method: "POST" }),
    }),
  }),
});

export const {
  useGetNotificationsInfiniteQuery,
  useReadAllNotificationsMutation,
  useReadNotificationMutation,
  useGetFavoritesQuery,
  useToggleFavoriteMutation,
  useGetChatsQuery,
  useCreateChatMutation,
  useMarkChatReadMutation,
  useDeleteChatMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useGetSupportTicketsQuery,
  useGetSupportTicketQuery,
  useCreateSupportTicketMutation,
  useReplySupportTicketMutation,
  useGetMySubscriptionQuery,
  useCheckoutSubscriptionMutation,
  useUpdateSubscriptionPlanMutation,
  useCancelUpcomingPlanMutation,
  useCancelSubscriptionMutation,
  useOpenBillingPortalMutation,
} = engagementApi;

export function useLiveNotifications(enabled: boolean) {
  const role = useAppSelector((state) => state.auth.user?.role);
  const audience = role === "pro" ? "pro" : "homeowner";
  const query = useGetNotificationsInfiniteQuery(undefined, { skip: !enabled });
  const items = useMemo(() => {
    const pages = query.data?.pages ?? [];
    return pages.flatMap((page, pageIndex) => {
      const rows = Array.isArray(page.data) ? page.data : [];
      return rows.map((raw, index) =>
        mapNotification(raw, pageIndex * NOTIFICATION_PAGE_SIZE + index, audience),
      );
    });
  }, [query.data, audience]);
  const reportedUnread = query.data?.pages?.[0]?.meta?.unreadCount;
  const unreadCount =
    typeof reportedUnread === "number"
      ? reportedUnread
      : items.filter((item) => !item.read).length;
  return {
    items,
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: Boolean(query.hasNextPage),
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}

export function useUnreadChatCount(enabled: boolean) {
  const query = useGetChatsQuery(undefined, { skip: !enabled });
  return useMemo(() => {
    const chats = unwrapChats(query.data?.data);
    return chats.reduce((sum, chat) => sum + Number(chat.unreadCount || 0), 0);
  }, [query.data]);
}
