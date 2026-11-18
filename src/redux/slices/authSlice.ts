import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { demoHomeowner, demoProUser } from "@/Mockdata";
import { authToken } from "@/utils/authToken";
import type { User, UserRole } from "@/types";

const CURRENT_USER_KEY = "lhf-current-user";

interface AuthState {
  user: User | null;
  hydrated: boolean;
}

function userFromRole(role: UserRole): User {
  // Placeholder only until /users/profile hydrates — keep ids empty of demo seeds
  // when a real JWT is present so dashboards don't show Mockdata as "live".
  if (role === "pro") return { ...demoProUser, id: "pending-pro", name: "Professional" };
  return { ...demoHomeowner, id: "pending-homeowner", name: "Homeowner" };
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistStoredUser(user: User | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch {
    /* ignore storage errors */
  }
}

const initialState: AuthState = {
  user: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrate(state) {
      if (typeof window === "undefined") return;
      const token = authToken.getAccessToken();
      const role = authToken.getRole();

      if (token && role) {
        const stored = getStoredUser();
        if (stored) {
          state.user = stored;
        } else {
          const base = userFromRole(role);
          state.user = { ...base, role };
        }
      } else {
        state.user = null;
      }
      state.hydrated = true;
    },
    login(state, action: PayloadAction<User>) {
      const payload = action.payload;
      const normalizedUser =
        payload.role === "pro" && (payload.id === "user-pro-1" || payload.id.startsWith("user-pro-"))
          ? { ...payload, id: payload.id === "user-pro-1" ? "pro-1" : payload.id.replace(/^user-/, "") }
          : payload;

      state.user = normalizedUser;
      state.hydrated = true;
      persistStoredUser(normalizedUser);
      authToken.setTokens({
        accessToken: authToken.getAccessToken() || "",
        role: normalizedUser.role,
      });
    },
    loginAs(state, action: PayloadAction<UserRole | { role: UserRole; profile?: Partial<User> }>) {
      const role = typeof action.payload === "string" ? action.payload : action.payload.role;
      const profile = typeof action.payload === "string" ? undefined : action.payload.profile;
      const base = userFromRole(role);
      const user = profile ? { ...base, ...profile, id: base.id, role } : base;

      state.user = user;
      state.hydrated = true;
      persistStoredUser(user);
      authToken.setTokens({
        accessToken: authToken.getAccessToken() || "demo-token",
        role,
      });
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload, id: state.user.id, role: state.user.role };
      persistStoredUser(state.user);
    },
    logout(state) {
      state.user = null;
      state.hydrated = true;
      persistStoredUser(null);
      authToken.clearTokens();
    },
  },
});

export const { hydrate, login, loginAs, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
