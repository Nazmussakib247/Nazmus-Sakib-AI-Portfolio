import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const verifyQuery = trpc.admin.verify.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // Remove tokens issued by the legacy localStorage-based auth flow.
    localStorage.removeItem("adminToken");
  }, []);

  useEffect(() => {
    if (verifyQuery.isSuccess) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else if (verifyQuery.isError) {
      setIsAuthenticated(false);
      setIsLoading(false);
    } else if (!verifyQuery.isFetching) {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [verifyQuery.isSuccess, verifyQuery.isError, verifyQuery.isFetching]);

  const login = useCallback(async (password: string) => {
    const result = await fetch("/api/trpc/admin.login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ json: { password } }),
    }).then((response) => response.json());

    const data = result.result?.data?.json ?? result.result?.data;
    if (data?.success) {
      await verifyQuery.refetch();
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, message: data?.message || "Login failed" };
  }, [verifyQuery]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/trpc/admin.logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } finally {
      localStorage.removeItem("adminToken");
      setIsAuthenticated(false);
    }
  }, []);

  return { isAuthenticated, isLoading, login, logout };
}
