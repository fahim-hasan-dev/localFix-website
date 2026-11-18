import type {
  Booking,
  BookingStatus,
  ChatMessage,
  Job,
  JobStatus,
  MessageThread,
  OfferStatus,
  PropertyType,
  Quote,
  QuotePriceType,
  Urgency,
} from "@/types";
import { mediaUrl } from "@/utils/mediaUrl";
import { slugify, type ApiNamedRef } from "@/lib/api-mappers";

export interface ApiJobRequest {
  _id: string;
  headline?: string;
  title?: string;
  description?: string;
  status?: string;
  timeframe?: string;
  preferredArrivalWindow?: string;
  propertyType?: string;
  partsAndMaterials?: string;
  estimatedBudget?: number | string;
  projectPhotos?: string[];
  quotesCount?: number;
  createdAt?: string;
  homeowner?: { _id?: string; name?: string; profileImage?: string };
  category?: string | ApiNamedRef;
  professional?: { _id?: string; name?: string; companyName?: string } | string | null;
  serviceLocation?: {
    zipCode?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  quotations?: ApiQuotation[];
  booking?: ApiBooking | null;
}

export interface ApiQuotation {
  _id: string;
  jobRequest?: string | { _id?: string };
  professional?: { _id?: string; name?: string; companyName?: string; profileImage?: string } | string;
  priceType?: string;
  totalRate?: number;
  scopeOfWork?: string;
  exclusions?: string;
  partsAndMaterialsIncluded?: string;
  estimatedDuration?: string;
  earliestAvailableDate?: string;
  arrivalTimeWindow?: string;
  confirmedArrivalWindow?: string;
  warranty?: string;
  offerValidUntil?: string;
  additionalNotes?: string;
  status?: string;
  isHired?: boolean;
  appointmentDate?: string;
  paymentMethod?: string;
  acceptedAt?: string;
  createdAt?: string;
}

export interface ApiBooking {
  _id: string;
  jobRequest?: string | ApiJobRequest;
  quotation?: string | ApiQuotation;
  homeowner?: {
    _id?: string;
    name?: string;
    profileImage?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  professional?: { _id?: string; name?: string; companyName?: string; profileImage?: string };
  totalAmount?: number;
  appointmentDate?: string;
  arrivalTimeWindow?: string;
  paymentMethod?: string;
  settledPaymentMethod?: string;
  status?: string;
  contractorCompletionNote?: string;
  isPaidDirectly?: boolean;
  isSatisfactionConfirmed?: boolean;
  createdAt?: string;
  onTheWayAt?: string;
  workStartedAt?: string;
  contractorCompletedAt?: string;
  homeownerCompletedAt?: string;
  paidAt?: string;
  paymentStatus?: string;
}

export interface ApiChatParticipant {
  _id: string;
  name?: string;
  role?: string;
  profileImage?: string;
  companyName?: string;
}

export interface ApiChatMessage {
  _id: string;
  text?: string;
  image?: string;
  read?: boolean;
  createdAt?: string;
  sender?: ApiChatParticipant | string;
}

export interface ApiChat {
  _id: string;
  participants?: ApiChatParticipant[];
  lastMessage?: ApiChatMessage | null;
  unreadCount?: number;
  isRead?: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export interface ApiReviewItem {
  _id: string;
  rating?: number;
  feedback?: string;
  reply?: string | null;
  createdAt?: string;
  homeowner?: { name?: string; profileImage?: string };
  booking?: { _id?: string };
}

function refId(value?: string | { _id?: string } | null) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
}

function refName(value?: string | ApiNamedRef | null) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || "";
}

function mapUrgency(timeframe?: string): Urgency {
  const value = (timeframe || "").toLowerCase();
  if (value.includes("asap") || value.includes("urgent") || value.includes("today")) return "asap";
  if (value.includes("week") && !value.includes("two")) return "this_week";
  if (value.includes("two") || value.includes("2 week")) return "two_weeks";
  return "flexible";
}

function mapPropertyType(value?: string): PropertyType | undefined {
  const raw = (value || "").toLowerCase();
  if (raw.includes("single")) return "single_family";
  if (raw.includes("condo")) return "condo";
  if (raw.includes("town")) return "townhome";
  if (raw.includes("apartment")) return "apartment";
  if (raw.includes("commercial")) return "commercial";
  if (!raw) return undefined;
  return "other";
}

export function mapJobStatus(status?: string, quotesCount = 0): JobStatus {
  const value = (status || "").toLowerCase();
  switch (value) {
    case "draft":
      return "draft";
    case "awaiting_quotes":
    case "awaiting_quote":
    case "open":
    case "active":
    case "pending":
    case "published":
      return quotesCount > 0 ? "quotes_in" : "getting_quotes";
    case "quoted":
    case "quotes_received":
      return "quotes_in";
    case "hired":
    case "accepted":
      return "hired";
    case "scheduled":
    case "upcoming":
      return "scheduled";
    case "on_the_way":
    case "en_route":
      return "en_route";
    case "in_progress":
    case "active_on_site":
    case "on_site":
      return "in_progress";
    case "pending_completion":
    case "awaiting_confirm":
    case "awaiting_confirmation":
      return "awaiting_confirm";
    case "completed":
    case "done":
      return "completed";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "disputed":
      return "disputed";
    default:
      return quotesCount > 0 ? "quotes_in" : "active";
  }
}

export function mapOfferStatus(status?: string, isHired?: boolean): OfferStatus {
  if (isHired) return "accepted";
  const value = (status || "").toLowerCase();
  switch (value) {
    case "accepted":
    case "hired":
      return "accepted";
    case "declined":
    case "rejected":
      return "rejected";
    case "withdrawn":
      return "withdrawn";
    case "expired":
      return "expired";
    case "countered":
      return "countered";
    default:
      return "pending";
  }
}

function mapPriceType(value?: string): QuotePriceType {
  const raw = (value || "").toLowerCase().replace(/[_-]/g, "");
  if (raw.includes("estimate")) return "estimate";
  if (raw.includes("hourly")) return "hourly";
  if (raw.includes("timeandmaterials") || raw.includes("timeandmaterial")) return "time_and_materials";
  return "fixed";
}

/** UI price type → API enum (`time_and_materials` → `timeandmaterials`). */
export function toApiPriceType(type: QuotePriceType): "fixed" | "estimate" | "hourly" | "timeandmaterials" {
  return type === "time_and_materials" ? "timeandmaterials" : type;
}

const API_PAYMENT_METHODS: Record<string, string> = {
  cash: "cash",
  bank_transfer: "bank_transfer",
  stripe: "stripe",
  card: "card",
  check: "check",
  digital_wallet: "digital_wallet",
  other: "other",
};

/** UI payment method key → API display string (e.g. `cash` → `Cash`). */
export function toApiPaymentMethod(method: string): string {
  return API_PAYMENT_METHODS[method] ?? method;
}

function mapBookingStatus(status?: string): BookingStatus {
  const value = (status || "").toLowerCase();
  if (value.includes("reschedule")) return "reschedule_requested";
  if (value === "scheduled" || value === "upcoming" || value === "confirmed") return "confirmed";
  return "pending_schedule";
}

export function mapJobRequest(raw: ApiJobRequest): Job {
  const categoryName = refName(raw.category) || "";
  const professionalId = refId(raw.professional as string | { _id?: string } | null);
  const quotesCount = raw.quotesCount ?? raw.quotations?.length ?? 0;
  const homeownerName = raw.homeowner?.name?.trim() || "";

  return {
    id: raw._id,
    title: raw.headline || raw.title || "Service request",
    categorySlug: slugify(categoryName) || refId(raw.category) || "",
    description: raw.description || "",
    zip: raw.serviceLocation?.zipCode || "",
    city: raw.serviceLocation?.city || "",
    state: raw.serviceLocation?.state || "",
    street: raw.serviceLocation?.address || undefined,
    urgency: mapUrgency(raw.timeframe),
    timeframeLabel: raw.timeframe || undefined,
    budget: raw.estimatedBudget != null ? String(raw.estimatedBudget) : undefined,
    propertyType: mapPropertyType(raw.propertyType),
    propertyTypeLabel: raw.propertyType || undefined,
    status: mapJobStatus(raw.status, quotesCount),
    postedAt: raw.createdAt || new Date().toISOString(),
    homeownerName: homeownerName || "Client",
    homeownerId: raw.homeowner?._id || undefined,
    homeownerAvatar: mediaUrl(raw.homeowner?.profileImage) || undefined,
    requestedProId: professionalId || undefined,
    visibility: professionalId ? "direct" : "open",
    photos: (raw.projectPhotos || []).map((photo) => mediaUrl(photo)).filter(Boolean),
    intakeAnswers: [
      raw.partsAndMaterials
        ? { id: "materials", label: "Parts & materials", value: raw.partsAndMaterials }
        : null,
      raw.preferredArrivalWindow
        ? { id: "timing", label: "Preferred arrival", value: raw.preferredArrivalWindow }
        : null,
      raw.timeframe ? { id: "timeframe", label: "Timeframe", value: raw.timeframe } : null,
      raw.propertyType
        ? { id: "property", label: "Property type", value: raw.propertyType }
        : null,
      raw.estimatedBudget != null
        ? { id: "budget", label: "Budget", value: `$${raw.estimatedBudget}` }
        : null,
    ].filter(Boolean) as Job["intakeAnswers"],
  };
}

export function mapQuotation(raw: ApiQuotation, fallbackJobId = ""): Quote {
  const jobId = refId(raw.jobRequest) || fallbackJobId;
  const proId = refId(raw.professional as string | { _id?: string } | null);
  const materials = (raw.partsAndMaterialsIncluded || "").toLowerCase();
  const materialsKnown = Boolean(materials);
  const materialsIncluded = !materialsKnown
    ? undefined
    : !/labor_only|labour_only|no_lab/.test(materials) &&
      (/yes|parts_included|included/.test(materials));

  return {
    id: raw._id,
    jobId,
    proId,
    priceType: mapPriceType(raw.priceType),
    amount: Number(raw.totalRate || 0),
    scope: raw.scopeOfWork || "",
    exclusions: raw.exclusions || undefined,
    availability: raw.arrivalTimeWindow || raw.confirmedArrivalWindow || raw.earliestAvailableDate || "",
    warranty: raw.warranty || undefined,
    materialsIncluded,
    estimatedDuration: raw.estimatedDuration || undefined,
    proposedSchedule: raw.earliestAvailableDate || undefined,
    expiresAt: raw.offerValidUntil || undefined,
    notes: raw.additionalNotes || undefined,
    status: mapOfferStatus(raw.status, raw.isHired),
    createdAt: raw.createdAt,
  };
}

export function mapBooking(raw: ApiBooking): Booking {
  const job =
    typeof raw.jobRequest === "object" && raw.jobRequest ? raw.jobRequest : null;
  const quote =
    typeof raw.quotation === "object" && raw.quotation ? raw.quotation : null;
  const jobId = job?._id || refId(raw.jobRequest as string | { _id?: string } | null);
  const quoteId = quote?._id || refId(raw.quotation as string | { _id?: string } | null);
  const proId = raw.professional?._id || "";

  const paid = (raw.paymentStatus || "").toLowerCase() === "paid" || Boolean(raw.paidAt);

  return {
    id: raw._id,
    jobId,
    quoteId,
    proId,
    homeownerName: raw.homeowner?.name,
    agreedPrice: Number(raw.totalAmount || quote?.totalRate || 0),
    scheduledDate: raw.appointmentDate || "",
    scheduledTime: raw.arrivalTimeWindow || "",
    arrivalWindow: raw.arrivalTimeWindow || "",
    scopeSnapshot: quote?.scopeOfWork || job?.description || "",
    status: mapBookingStatus(raw.status),
    notes: raw.contractorCompletionNote || undefined,
    acceptedAt: raw.createdAt,
    paymentMethod: undefined,
    paymentTerms: raw.settledPaymentMethod || raw.paymentMethod || undefined,
    paidAt: raw.paidAt || (paid ? raw.homeownerCompletedAt : undefined),
    paymentConfirmedByHomeowner: Boolean(raw.homeownerCompletedAt || paid),
    paymentConfirmedByPro: Boolean(raw.contractorCompletedAt),
  };
}

const BOOKED_STAGES: JobStatus[] = [
  "hired",
  "scheduled",
  "en_route",
  "in_progress",
  "awaiting_confirm",
  "completed",
  "cancelled",
  "disputed",
];

/** Job detail payloads include quotations and, once hired, the booking. */
export function mapLiveJob(raw: ApiJobRequest) {
  const quotes = (raw.quotations || []).map((quote) => mapQuotation(quote, raw._id));
  const job = mapJobRequest(raw);
  const bookingRaw = raw.booking && typeof raw.booking === "object" ? raw.booking : null;
  if (bookingRaw?.status) {
    const stage = mapJobStatus(bookingRaw.status, quotes.length);
    if (BOOKED_STAGES.includes(stage)) job.status = stage;
  }
  return {
    job,
    quotes,
    booking: bookingRaw
      ? mapBooking({ ...bookingRaw, jobRequest: bookingRaw.jobRequest || raw._id })
      : null,
  };
}

export function liveJobKey(mapped: { job: Job; quotes: Quote[]; booking?: Booking | null }) {
  const quotes = mapped.quotes.map((quote) => `${quote.id}:${quote.status}`).join(",");
  return `${mapped.job.id}:${mapped.job.status}:${mapped.booking?.id ?? ""}:${mapped.booking?.status ?? ""}:${mapped.booking?.paidAt ?? ""}:${quotes}`;
}

export function bookingToJob(raw: ApiBooking): Job {
  const jobRaw =
    typeof raw.jobRequest === "object" && raw.jobRequest
      ? raw.jobRequest
      : ({
          _id: refId(raw.jobRequest as string | { _id?: string } | null) || raw._id,
          headline: "Booking",
          status: raw.status,
          homeowner: raw.homeowner,
          professional: raw.professional,
        } as ApiJobRequest);

  const homeowner =
    raw.homeowner && typeof raw.homeowner === "object" ? raw.homeowner : jobRaw.homeowner;
  const mapped = mapJobRequest({
    ...jobRaw,
    status: raw.status || jobRaw.status,
    professional: raw.professional || jobRaw.professional,
    homeowner,
  });

  return {
    ...mapped,
    status: mapJobStatus(raw.status, mapped.status === "quotes_in" ? 1 : 0),
  };
}

export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  for (const key of ["items", "results", "jobs", "bookings", "reviews", "chats", "data"]) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Lead/direct/job detail & list items may wrap the job request in `jobRequest` / `job`. */
export function unwrapJobRecord(raw: unknown): ApiJobRequest | null {
  if (!isRecord(raw)) return null;
  for (const key of ["jobRequest", "job"]) {
    const nested = raw[key];
    if (isRecord(nested) && typeof nested._id === "string") {
      return {
        ...(nested as unknown as ApiJobRequest),
        homeowner: (nested.homeowner ?? raw.homeowner) as ApiJobRequest["homeowner"],
        quotations: (nested.quotations ?? raw.quotations) as ApiJobRequest["quotations"],
      };
    }
  }
  return typeof raw._id === "string" ? (raw as unknown as ApiJobRequest) : null;
}

/** Once hired, the attached booking stage replaces the job status on the card. */
function applyBookingStage(job: Job, booking: unknown) {
  if (!isRecord(booking) || typeof booking.status !== "string") return;
  const stage = mapJobStatus(booking.status);
  if (BOOKED_STAGES.includes(stage)) job.status = stage;
}

/**
 * "My proposals" items may be quotations (with a populated `jobRequest`) or
 * jobs carrying a `quotations` array. Returns the mapped job plus any quotes.
 */
export function mapProposalItem(raw: unknown): { job: Job; quotes: Quote[] } | null {
  if (!isRecord(raw)) return null;
  const looksLikeQuotation =
    "totalRate" in raw || "scopeOfWork" in raw || (isRecord(raw.jobRequest) && "priceType" in raw);
  if (looksLikeQuotation) {
    if (!isRecord(raw.jobRequest)) return null; // un-populated quotation: no job to render
    const jobRaw = unwrapJobRecord({ jobRequest: raw.jobRequest });
    if (!jobRaw) return null;
    const job = mapJobRequest(jobRaw);
    applyBookingStage(job, raw.booking);
    return { job, quotes: [mapQuotation(raw as unknown as ApiQuotation, jobRaw._id)] };
  }
  const jobRaw = unwrapJobRecord(raw);
  if (!jobRaw) return null;
  const job = mapJobRequest(jobRaw);
  applyBookingStage(job, raw.booking ?? jobRaw.booking);
  return {
    job,
    quotes: (jobRaw.quotations || []).map((quote) => mapQuotation(quote, jobRaw._id)),
  };
}

export function unwrapChats(data: unknown): ApiChat[] {
  if (Array.isArray(data)) return data as ApiChat[];
  if (!data || typeof data !== "object") return [];
  const record = data as { chats?: ApiChat[] };
  return Array.isArray(record.chats) ? record.chats : [];
}

export function mapChatMessage(
  raw: ApiChatMessage,
  role: "homeowner" | "pro",
  myUserId?: string,
): ChatMessage {
  const sender = typeof raw.sender === "object" ? raw.sender : null;
  const senderId = sender?._id || (typeof raw.sender === "string" ? raw.sender : "");
  const senderRole = (sender?.role || "").toLowerCase();
  const isMine = myUserId ? senderId === myUserId : false;
  const mappedSender: "homeowner" | "pro" = isMine
    ? role
    : senderRole.includes("professional") || senderRole.includes("pro")
      ? "pro"
      : "homeowner";

  return {
    id: raw._id,
    sender: mappedSender,
    senderName: sender?.name || (mappedSender === "pro" ? "Professional" : "Homeowner"),
    body: raw.text || "",
    sentAt: raw.createdAt || "",
    read: Boolean(raw.read),
    attachment: raw.image
      ? {
          name: "Image",
          size: "",
          type: "image",
          url: mediaUrl(raw.image),
        }
      : undefined,
  };
}

export function mapChatThread(
  raw: ApiChat,
  role: "homeowner" | "pro",
  myUserId?: string,
): MessageThread {
  const other =
    (raw.participants || []).find((person) => person._id !== myUserId) ||
    raw.participants?.[0];
  const last = raw.lastMessage;
  const lastSenderObj = typeof last?.sender === "object" ? last.sender : null;
  const lastSenderRole = (lastSenderObj?.role || "").toLowerCase();
  const lastSender: "homeowner" | "pro" =
    lastSenderRole.includes("professional") || lastSenderRole.includes("pro")
      ? "pro"
      : "homeowner";

  return {
    id: raw._id,
    jobId: `chat:${raw._id}`,
    jobTitle: other?.companyName || other?.name || "Conversation",
    otherParty: other?.name || "User",
    proId: other?.role?.toLowerCase().includes("professional") ? other._id : undefined,
    unread: Number(raw.unreadCount || 0),
    lastMessage: last?.text || (last?.image ? "Sent an image" : "No messages yet"),
    lastSender,
    updatedAt: raw.updatedAt || raw.createdAt || "",
    isDirect: true,
    messages: last ? [mapChatMessage(last, role, myUserId)] : [],
  };
}

export function mapReviewCard(raw: ApiReviewItem) {
  return {
    id: raw._id,
    proId: "",
    author: raw.homeowner?.name || "Homeowner",
    avatar: mediaUrl(raw.homeowner?.profileImage),
    rating: Number(raw.rating || 0),
    text: raw.feedback || "",
    createdAt: raw.createdAt || "",
    reply: raw.reply || undefined,
    bookingId: raw.booking?._id,
  };
}

export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  try {
    const [meta, content] = dataUrl.split(",");
    if (!meta || !content) return null;
    const mime = /data:(.*?);base64/.exec(meta)?.[1] || "image/jpeg";
    const binary = atob(content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  } catch {
    return null;
  }
}
