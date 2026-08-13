'use client';

import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { UserProvider } from "../context/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Debugging hooks removed for production readiness.
    return () => {};
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        {children}
      </UserProvider>
    </QueryClientProvider>
  );
}
