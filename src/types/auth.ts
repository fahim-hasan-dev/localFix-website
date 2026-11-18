export type BackendUserRole = "home_owner" | "professional" | "admin" | "super_admin";

export interface BackendUser {
  _id?: string;
  id?: string;
  name: string;
  role: BackendUserRole;
  email: string;
  profileImage?: string;
  verified?: boolean;
  phone?: string;
  countryCode?: string;
  status?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  zipCode?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  companyName?: string;
  serviceRadiusInMiles?: number;
  yearsOfExperience?: string;
  category?: string;
  startingRate?: number;
  hourlyRate?: number;
  completedJobs?: number;
  localJobs?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  fcmToken?: string;
  deviceId?: string;
  deviceType?: "ios" | "android" | "web";
}

export interface HomeownerSignupRequest {
  role: "home_owner";
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  zipCode: string;
  agreedToTerms: boolean;
  countryCode?: string;
  profileImage?: string;
}

export interface ProSignupRequest {
  role: "professional";
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  zipCode: string;
  agreedToTerms: boolean;
  companyName: string;
  category: string;
  serviceRadiusInMiles: number;
  licenseNumber: string;
  licenseState: string;
  tradeLicenseCertificate?: string;
  insuranceCarrier?: string;
  insuranceCoverage?: string | number;
  insuranceCertificate?: string;
  backgroundCheckConsent: boolean;
  countryCode?: string;
  state?: string;
}

export type SignupRequest = HomeownerSignupRequest | ProSignupRequest;

export interface AuthResponseData {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  /** Some backends return the user as `user`; this API nests it as `data`. */
  user?: BackendUser;
  data?: BackendUser;
  resetToken?: string;
}

export interface VerifyEmailRequest {
  email: string;
  oneTimeCode: number;
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface ResendOtpRequest {
  email: string;
}
