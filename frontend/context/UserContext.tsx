'use client';

import React, { createContext, useContext } from "react";
import { UserProfile, authApi } from "../lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user = null, isLoading, refetch } = useQuery<UserProfile | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await authApi.getMe();
      } catch (error) {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const login = async (email: string, password: string) => {
    await authApi.login(email, password);
    await refetch();
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    } finally {
      queryClient.clear();
      // Force refetch to update 'me' query to null
      await queryClient.setQueryData(["me"], null);
      router.push("/login");
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
