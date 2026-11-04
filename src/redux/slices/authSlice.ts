import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { demoHomeowner, demoProUser } from "@/Mockdata";
import type { User, UserRole } from "@/types";

const STORAGE_KEY = "lhf-auth-role";
const USER_DATA_STORAGE_PREFIX = "lhf-user-data-";

interface AuthState {
  user: User | null;
  hydrated: boolean;
}

function userFromRole(role: UserRole) {
  if (role === "pro") return demoProUser;
  return demoHomeowner;
}

function getStoredUserData(role: UserRole): Partial<User> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${USER_DATA_STORAGE_PREFIX}${role}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUserData(role: UserRole, user: User) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${USER_DATA_STORAGE_PREFIX}${role}`, JSON.stringify(user));
  } catch {
    /* ignore storage errors */
  }
}

const initialState: AuthState = {
  user: null,
  hydrated: false,
};

function persistRole(role: UserRole | null) {
  if (typeof window === "undefined") return;
  try {
    if (role) {
      window.localStorage.setItem(STORAGE_KEY, role);
      document.cookie = `${STORAGE_KEY}=${role}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  } catch {
    /* ignore storage errors */
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrate(state) {
      if (typeof window === "undefined") return;
      let role = window.localStorage.getItem(STORAGE_KEY) as UserRole | null;
      if (!role && document.cookie) {
        const match = document.cookie.match(new RegExp(`(?:^|; )${STORAGE_KEY}=(pro|homeowner)`));
        if (match) role = match[1] as UserRole;
      }
      if (role === "pro" || role === "homeowner") {
        const base = userFromRole(role);
        const stored = getStoredUserData(role);
        state.user = stored ? { ...base, ...stored, id: base.id, role } : base;
      } else {
        state.user = null;
      }
      state.hydrated = true;
    },
    loginAs(state, action: PayloadAction<UserRole | { role: UserRole; profile?: Partial<User> }>) {
      const role = typeof action.payload === "string" ? action.payload : action.payload.role;
      const profile = typeof action.payload === "string" ? undefined : action.payload.profile;
      const base = userFromRole(role);
      state.user = profile ? { ...base, ...profile, id: base.id, role } : base;
      state.hydrated = true;
      persistRole(role);
      if (state.user) persistUserData(role, state.user);
    },
    login(state, action: PayloadAction<User>) {
      const payload = action.payload;
      const normalizedUser =
        payload.role === "pro" && (payload.id === "user-pro-1" || payload.id.startsWith("user-pro-"))
          ? { ...payload, id: payload.id === "user-pro-1" ? "pro-1" : payload.id.replace(/^user-/, "") }
          : payload;
      state.user = normalizedUser;
      state.hydrated = true;
      persistRole(normalizedUser.role);
      persistUserData(normalizedUser.role, normalizedUser);
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload, id: state.user.id, role: state.user.role };
      persistUserData(state.user.role, state.user);
    },
    logout(state) {
      state.user = null;
      state.hydrated = true;
      persistRole(null);
    },
  },
});

export const { hydrate, login, loginAs, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
