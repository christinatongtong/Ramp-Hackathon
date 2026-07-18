"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AVATARS,
  DEFAULT_AVATAR_ID,
  getAvatar,
  type AvatarDefinition,
  type AvatarId,
} from "@/lib/avatar/presets";

const STORAGE_KEY = "leetcode3d-avatar";

type AvatarContextValue = {
  avatarId: AvatarId;
  avatar: AvatarDefinition;
  setAvatarId: (id: AvatarId) => void;
};

const AvatarContext = createContext<AvatarContextValue | null>(null);

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [avatarId, setAvatarIdState] = useState<AvatarId>(DEFAULT_AVATAR_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AvatarId | null;
      if (stored && AVATARS.some((a) => a.id === stored)) {
        setAvatarIdState(stored);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setAvatarId = useCallback((id: AvatarId) => {
    setAvatarIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      avatarId,
      avatar: getAvatar(avatarId),
      setAvatarId,
    }),
    [avatarId, setAvatarId],
  );

  if (!hydrated) {
    return <>{children}</>;
  }

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    return {
      avatarId: DEFAULT_AVATAR_ID,
      avatar: getAvatar(DEFAULT_AVATAR_ID),
      setAvatarId: () => {},
    };
  }
  return ctx;
}
