import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { defaultWeeklyHours, type WeeklyHours } from "@/lib/business-hours";
import { type CredentialFile } from "@/lib/credential-file";
import type { JobStatus } from "@/types";

export type LeadAction = "saved" | "declined" | "scheduled" | "open" | "accepted";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
  role: "homeowner" | "pro" | "all";
}

export interface SavedAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface ReviewItem {
  id: string;
  jobId: string;
  proId: string;
  author: string;
  avatar?: string;
  rating: number;
  body: string;
  createdAt: string;
  reply?: string;
}

export interface InvoiceItem {
  id: string;
  date: string;
  period?: string;
  description?: string;
  amount: string;
  status: "paid" | "upcoming" | "failed";
}

interface FeaturesState {
  favorites: string[];
  notifications: AppNotification[];
  addresses: SavedAddress[];
  reviews: ReviewItem[];
  leadActions: Record<string, LeadAction>;
  jobPhotos: Record<string, string[]>;
  jobStatusOverride: Record<string, JobStatus>;
  invitedPros: Record<string, string[]>;
  twoFactorOn: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  membershipPaused: boolean;
  membershipCancelled: boolean;
  subscriptionPlan: "trial" | "monthly" | "annual";
  billingCycle: "monthly" | "annual";
  renewalDate: string;
  paymentMethod: {
    brand: string;
    last4: string;
    exp: string;
  } | null;
  trialDaysLeft: number;
  invoices: InvoiceItem[];
  applicationDraft: Record<string, string>;
  applicationStatus: "draft" | "submitted" | "needs_info" | "rejected" | "cleared";
  rejectionReason: string;
  contactUnlocked: boolean;
  proProfile: ProProfileData;
}

export interface ProServiceItem {
  id: string;
  name: string;
  description: string;
  price?: number;
  unit?: string;
  category?: string;
}

export interface ProSpecialOffer {
  active: boolean;
  title: string;
  discount: string;
  terms: string;
}

export interface ProPortfolioItem {
  id: string;
  title: string;
  image: string;
  category: string;
  description?: string;
}

export interface ProProfileData {
  businessName: string;
  contactName: string;
  avatar?: string;
  trade: string;
  categorySlug: string;
  tagline: string;
  bio: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  radiusMiles: number;
  startingPrice: number;
  yearsInBusiness: string;
  responseTime: string;
  emergency: boolean;
  businessHours: WeeklyHours;
  acceptedPayments: string[];
  services: ProServiceItem[];
  specialOffer: ProSpecialOffer;
  includedPerks: string[];
  licenseNumber: string;
  licenseState: string;
  licenseDoc: CredentialFile | null;
  insuranceCarrier: string;
  insuranceCoverage: string;
  insuranceExpires: string;
  insuranceDoc: CredentialFile | null;
  idDoc?: CredentialFile | null;
  portfolio: ProPortfolioItem[];
}

const emptyProProfile: ProProfileData = {
  businessName: "",
  contactName: "",
  trade: "",
  categorySlug: "",
  tagline: "",
  bio: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  radiusMiles: 25,
  startingPrice: 0,
  yearsInBusiness: "",
  responseTime: "",
  emergency: false,
  businessHours: defaultWeeklyHours(),
  acceptedPayments: [],
  specialOffer: {
    active: false,
    title: "",
    discount: "",
    terms: "",
  },
  services: [],
  includedPerks: [],
  licenseNumber: "",
  licenseState: "",
  licenseDoc: null,
  insuranceCarrier: "",
  insuranceCoverage: "",
  insuranceExpires: "",
  insuranceDoc: null,
  idDoc: null,
  portfolio: [],
};

const initialState: FeaturesState = {
  favorites: [],
  notifications: [],
  addresses: [],
  reviews: [],
  leadActions: {},
  jobPhotos: {},
  jobStatusOverride: {},
  invitedPros: {},
  twoFactorOn: false,
  emailVerified: false,
  phoneVerified: false,
  membershipPaused: false,
  membershipCancelled: false,
  subscriptionPlan: "trial",
  billingCycle: "monthly",
  renewalDate: "",
  paymentMethod: null,
  trialDaysLeft: 0,
  invoices: [],
  applicationDraft: {},
  applicationStatus: "draft",
  rejectionReason: "",
  contactUnlocked: false,
  proProfile: emptyProProfile,
};

/** Bumped to drop persisted demo seed from older localStorage. */
const FEATURES_STORAGE_KEY = "lhf-features-v4";

function persistFeatures(state: FeaturesState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      FEATURES_STORAGE_KEY,
      JSON.stringify({
        jobStatusOverride: state.jobStatusOverride,
        notifications: state.notifications,
        reviews: state.reviews,
        membershipCancelled: state.membershipCancelled,
        membershipPaused: state.membershipPaused,
        twoFactorOn: state.twoFactorOn,
        emailVerified: state.emailVerified,
        phoneVerified: state.phoneVerified,
        proProfile: state.proProfile,
        applicationStatus: state.applicationStatus,
        applicationDraft: state.applicationDraft,
        addresses: state.addresses,
      }),
    );
  } catch {
    /* ignore quota */
  }
}

const featuresSlice = createSlice({
  name: "features",
  initialState,
  reducers: {
    hydrateFeatures(state) {
      if (typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem(FEATURES_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.jobStatusOverride) {
            state.jobStatusOverride = { ...state.jobStatusOverride, ...saved.jobStatusOverride };
          }
          if (saved.notifications) {
            state.notifications = saved.notifications;
          }
          if (saved.reviews) {
            state.reviews = saved.reviews.filter(
              (r: ReviewItem) => r.id !== "rev-job-10" && r.jobId !== "job-10"
            );
          }
          if (saved.membershipCancelled !== undefined) {
            state.membershipCancelled = saved.membershipCancelled;
          }
          if (saved.membershipPaused !== undefined) {
            state.membershipPaused = saved.membershipPaused;
          }
          if (saved.twoFactorOn !== undefined) {
            state.twoFactorOn = saved.twoFactorOn;
          }
          if (saved.emailVerified !== undefined) {
            state.emailVerified = saved.emailVerified;
          }
          if (saved.phoneVerified !== undefined) {
            state.phoneVerified = saved.phoneVerified;
          }
          if (saved.proProfile) {
            const rawServices = Array.isArray(saved.proProfile.services) && saved.proProfile.services.length > 0
              ? saved.proProfile.services
              : state.proProfile.services;
            const patchedServices = rawServices.map((srv: ProServiceItem) => {
              if (!srv.category) {
                const match = initialState.proProfile.services.find(
                  (s) => s.id === srv.id || s.name.toLowerCase() === srv.name.toLowerCase()
                );
                if (match?.category) {
                  return { ...srv, category: match.category };
                }
              }
              return srv;
            });
            state.proProfile = {
              ...state.proProfile,
              ...saved.proProfile,
              services: patchedServices,
            };
          }
          if (saved.applicationStatus) {
            state.applicationStatus = saved.applicationStatus;
          }
          if (saved.applicationDraft) {
            state.applicationDraft = { ...state.applicationDraft, ...saved.applicationDraft };
          }
          if (saved.addresses) {
            state.addresses = saved.addresses;
          }
        }
      } catch {
        /* ignore */
      }
    },
    toggleFavorite(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.favorites = state.favorites.includes(id)
        ? state.favorites.filter((item) => item !== id)
        : [...state.favorites, id];
    },
    markNotificationRead(state, action: PayloadAction<string>) {
      const note = state.notifications.find((item) => item.id === action.payload);
      if (note) note.read = true;
      persistFeatures(state);
    },
    markAllNotificationsRead(state, action: PayloadAction<"homeowner" | "pro">) {
      state.notifications.forEach((item) => {
        if (item.role === action.payload || item.role === "all") item.read = true;
      });
      persistFeatures(state);
    },
    addNotification(state, action: PayloadAction<Omit<AppNotification, "id" | "read">>) {
      state.notifications.unshift({
        ...action.payload,
        id: `n-${Date.now()}`,
        read: false,
      });
      persistFeatures(state);
    },
    addAddress(state, action: PayloadAction<Omit<SavedAddress, "id">>) {
      state.addresses.push({ ...action.payload, id: `addr-${Date.now()}` });
      persistFeatures(state);
    },
    updateAddress(state, action: PayloadAction<SavedAddress>) {
      const index = state.addresses.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) state.addresses[index] = action.payload;
      persistFeatures(state);
    },
    removeAddress(state, action: PayloadAction<string>) {
      state.addresses = state.addresses.filter((item) => item.id !== action.payload);
      persistFeatures(state);
    },
    setLeadAction(state, action: PayloadAction<{ jobId: string; action: LeadAction }>) {
      state.leadActions[action.payload.jobId] = action.payload.action;
    },
    setJobPhotos(state, action: PayloadAction<{ jobId: string; photos: string[] }>) {
      state.jobPhotos[action.payload.jobId] = action.payload.photos;
    },
    setJobStatus(state, action: PayloadAction<{ jobId: string; status: JobStatus }>) {
      state.jobStatusOverride[action.payload.jobId] = action.payload.status;
      persistFeatures(state);
    },
    invitePro(state, action: PayloadAction<{ jobId: string; proId: string }>) {
      const list = state.invitedPros[action.payload.jobId] ?? [];
      if (!list.includes(action.payload.proId)) {
        state.invitedPros[action.payload.jobId] = [...list, action.payload.proId];
      }
    },
    addReview(state, action: PayloadAction<Omit<ReviewItem, "id">>) {
      state.reviews.unshift({ ...action.payload, id: `rev-${Date.now()}` });
      persistFeatures(state);
    },
    updateReview(
      state,
      action: PayloadAction<{ id: string; rating: number; body: string }>,
    ) {
      const review = state.reviews.find((item) => item.id === action.payload.id);
      if (review) {
        review.rating = action.payload.rating;
        review.body = action.payload.body;
      }
      persistFeatures(state);
    },
    replyToReview(state, action: PayloadAction<{ id: string; reply: string }>) {
      const review = state.reviews.find((item) => item.id === action.payload.id);
      if (review) review.reply = action.payload.reply;
      persistFeatures(state);
    },
    setTwoFactor(state, action: PayloadAction<boolean>) {
      state.twoFactorOn = action.payload;
      persistFeatures(state);
    },
    setEmailVerified(state, action: PayloadAction<boolean>) {
      state.emailVerified = action.payload;
      persistFeatures(state);
    },
    setPhoneVerified(state, action: PayloadAction<boolean>) {
      state.phoneVerified = action.payload;
      persistFeatures(state);
    },
    setMembershipPaused(state, action: PayloadAction<boolean>) {
      state.membershipPaused = action.payload;
      if (action.payload) {
        state.membershipCancelled = false;
        state.contactUnlocked = false;
      }
      persistFeatures(state);
    },
    setMembershipCancelled(state, action: PayloadAction<boolean>) {
      state.membershipCancelled = action.payload;
      if (action.payload) {
        state.membershipPaused = false;
        state.contactUnlocked = false;
      }
      persistFeatures(state);
    },
    saveApplicationDraft(state, action: PayloadAction<Record<string, string>>) {
      state.applicationDraft = { ...state.applicationDraft, ...action.payload };
      state.applicationStatus = "draft";
      persistFeatures(state);
    },
    submitApplication(state) {
      state.applicationStatus = "submitted";
      state.rejectionReason = "";
      state.contactUnlocked = false;
      persistFeatures(state);
    },
    setApplicationNeedsInfo(state, action: PayloadAction<string>) {
      state.applicationStatus = "needs_info";
      state.rejectionReason = action.payload;
      state.contactUnlocked = false;
      persistFeatures(state);
    },
    setApplicationCleared(state) {
      state.applicationStatus = "cleared";
      state.rejectionReason = "";
      persistFeatures(state);
    },
    setApplicationRejected(state, action: PayloadAction<string>) {
      state.applicationStatus = "rejected";
      state.rejectionReason = action.payload;
      state.contactUnlocked = false;
      persistFeatures(state);
    },
    unlockContact(state) {
      state.contactUnlocked = true;
    },
    lockContact(state) {
      state.contactUnlocked = false;
    },
    setSubscriptionPlan(
      state,
      action: PayloadAction<{
        plan: "trial" | "monthly" | "annual";
        billingCycle?: "monthly" | "annual";
        renewalDate?: string;
      }>,
    ) {
      state.subscriptionPlan = action.payload.plan;
      if (action.payload.billingCycle) state.billingCycle = action.payload.billingCycle;
      if (action.payload.renewalDate) state.renewalDate = action.payload.renewalDate;
      state.membershipPaused = false;
      state.membershipCancelled = false;
      state.contactUnlocked = true;
    },
    updatePaymentMethod(
      state,
      action: PayloadAction<{
        brand: string;
        last4: string;
        exp: string;
      }>,
    ) {
      state.paymentMethod = action.payload;
    },
    updateProProfile(state, action: PayloadAction<Partial<ProProfileData>>) {
      state.proProfile = {
        ...state.proProfile,
        ...action.payload,
        businessHours: action.payload.businessHours ?? state.proProfile.businessHours,
        specialOffer: {
          ...state.proProfile.specialOffer,
          ...(action.payload.specialOffer ?? {}),
        },
      };
      persistFeatures(state);
    },
  },
});

export const {
  hydrateFeatures,
  toggleFavorite,
  markNotificationRead,
  markAllNotificationsRead,
  addNotification,
  addAddress,
  updateAddress,
  removeAddress,
  setLeadAction,
  setJobPhotos,
  setJobStatus,
  invitePro,
  addReview,
  updateReview,
  replyToReview,
  setTwoFactor,
  setEmailVerified,
  setPhoneVerified,
  setMembershipPaused,
  setMembershipCancelled,
  saveApplicationDraft,
  submitApplication,
  setApplicationNeedsInfo,
  setApplicationCleared,
  setApplicationRejected,
  unlockContact,
  lockContact,
  setSubscriptionPlan,
  updatePaymentMethod,
  updateProProfile,
} = featuresSlice.actions;

export default featuresSlice.reducer;
