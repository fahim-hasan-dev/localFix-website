import { weeklyHoursFromApi } from "@/lib/business-hours";
import type {
  Category,
  Professional,
  ProfessionalPhoto,
  ProfessionalReview,
  ProfessionalService,
} from "@/types";
import { mediaUrl } from "@/utils/mediaUrl";

export interface ApiCategory {
  _id: string;
  name: string;
  coverImage?: string;
  icon?: string;
}

export interface ApiNamedRef {
  _id?: string;
  name?: string;
}

export interface ApiService {
  _id: string;
  name: string;
  description?: string;
  category?: string | ApiNamedRef;
}

export interface ApiProjectPhoto {
  _id?: string;
  image?: string;
  title?: string;
  category?: string | ApiNamedRef;
}

export interface ApiReview {
  _id: string;
  rating?: number;
  feedback?: string;
  reply?: string | null;
  createdAt?: string;
  homeowner?: { name?: string; profileImage?: string };
}

export interface ApiProfessional {
  _id: string;
  name?: string;
  companyName?: string;
  profileImage?: string;
  coverImage?: string;
  thumbnail?: string;
  about?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  serviceRadiusInMiles?: number;
  yearsOfExperience?: string;
  averageRating?: number;
  totalReviews?: number;
  completedJobs?: number;
  localJobs?: number;
  responseTime?: string;
  availability?: string;
  recommendationRate?: number;
  recommendationPercentage?: number;
  isBackgroundVerified?: boolean;
  startingPrice?: number;
  startingRate?: number;
  hourlyRate?: number;
  verified?: boolean;
  isLicenseVerified?: boolean;
  isInsuranceVerified?: boolean;
  isFavorite?: boolean;
  category?: string | ApiNamedRef;
  services?: ApiService[];
  projectPhotos?: ApiProjectPhoto[];
  reviews?: ApiReview[];
  businessHours?: {
    emergencyDispatchAvailable?: boolean;
    mode?: string;
    allDays?: unknown;
    days?: Record<string, unknown>;
  } | null;
  distanceInMiles?: number | null;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function refName(value?: string | ApiNamedRef | null) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || "";
}

function refId(value?: string | ApiNamedRef | null) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
}

export function mapCategory(category: ApiCategory): Category {
  return {
    id: category._id,
    name: category.name,
    slug: slugify(category.name),
    summary: "",
    typicalRange: "",
    unit: "",
    image: mediaUrl(category.coverImage || category.icon),
    icon: mediaUrl(category.icon),
  };
}

function mapService(service: ApiService): ProfessionalService {
  return {
    id: service._id,
    name: service.name,
    description: service.description || "",
    category: refName(service.category),
    categoryId: refId(service.category),
  };
}

function mapPhoto(photo: ApiProjectPhoto, index: number): ProfessionalPhoto {
  const category = refName(photo.category) || "Project";
  return {
    id: photo._id || `photo-${index}`,
    title: photo.title || category,
    category,
    image: mediaUrl(photo.image),
    description: photo.title || category,
  };
}

function mapReview(review: ApiReview): ProfessionalReview {
  return {
    id: review._id,
    author: review.homeowner?.name || "Homeowner",
    avatar: mediaUrl(review.homeowner?.profileImage),
    rating: review.rating || 0,
    text: review.feedback || "",
    createdAt: review.createdAt || "",
    reply: review.reply || undefined,
  };
}

export function mapProfessional(pro: ApiProfessional): Professional {
  const categoryName = refName(pro.category) || pro.services?.[0]?.name || "";
  const categorySlug = slugify(categoryName) || "services";
  const available = (pro.availability || "").toLowerCase().includes("available");

  return {
    id: pro._id,
    name: pro.name || "",
    businessName: pro.companyName || pro.name || "",
    trade: categoryName,
    categorySlug,
    city: pro.city || "",
    state: pro.state || "",
    zip: pro.zipCode || "",
    radiusMiles: pro.serviceRadiusInMiles || 0,
    yearsInBusiness: pro.yearsOfExperience || "",
    rating: pro.averageRating || 0,
    reviewCount: pro.totalReviews || 0,
    jobsCompleted: pro.completedJobs || 0,
    localJobs: pro.localJobs || 0,
    responseTime: pro.responseTime || "",
    bio: pro.about || "",
    clearance: pro.verified === false ? "pending" : "cleared",
    licensed: Boolean(pro.isLicenseVerified),
    insured: Boolean(pro.isInsuranceVerified),
    emergency: Boolean(pro.businessHours?.emergencyDispatchAvailable),
    backgroundChecked: Boolean(pro.isBackgroundVerified),
    businessHours: weeklyHoursFromApi(pro.businessHours),
    recommendationRate: pro.recommendationPercentage ?? pro.recommendationRate ?? null,
    startingPrice: Number(pro.startingPrice ?? pro.startingRate ?? pro.hourlyRate ?? 0) || 0,
    availabilityNote: pro.availability || "",
    availableThisWeek: available,
    avatar: mediaUrl(pro.profileImage),
    coverImage: mediaUrl(
      pro.profileImage ||
        pro.coverImage ||
        pro.thumbnail ||
        pro.projectPhotos?.[0]?.image,
    ),
    isFavorite: Boolean(pro.isFavorite),
    liveServices: (pro.services || []).map(mapService),
    livePhotos: (pro.projectPhotos || []).map(mapPhoto),
    liveReviews: (pro.reviews || []).map(mapReview),
  };
}

export function unwrapProfessionals(data: unknown): ApiProfessional[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as ApiProfessional & { professional?: ApiProfessional; user?: ApiProfessional };
    const pro = record.professional || record.user || record;
    return pro._id ? [pro] : [];
  });
}
