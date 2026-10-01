import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import type { HistoryResponse, StudySession } from "@/types/history";

export function useStudyHistory() {
  const { client, ready, user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [pagination, setPagination] = useState({
    page: 0,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const loadingRef = useRef(false);
  const userId = user?.id;

  const loadPage = useCallback(
    async (page: number) => {
      if (!ready || !userId || (page > 1 && loadingRef.current)) return;
      const request = ++generation.current;
      loadingRef.current = true;
      setLoading(page === 1);
      setLoadingMore(page > 1);
      setError("");
      try {
        const result = await client.authorized<HistoryResponse>(
          `/history?page=${page}&limit=20`,
        );
        if (request !== generation.current) return;
        setSessions((current) =>
          page === 1
            ? result.items
            : [
                ...current,
                ...result.items.filter(
                  (item) => !current.some((old) => old.id === item.id),
                ),
              ],
        );
        setPagination(result.pagination);
      } catch (failure) {
        if (request === generation.current)
          setError((failure as Error).message);
      } finally {
        if (request === generation.current) {
          loadingRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [client, ready, userId],
  );

  useFocusEffect(
    useCallback(() => {
      setSessions([]);
      setPagination({ page: 0, total: 0, totalPages: 0 });
      void loadPage(1);
      return () => {
        generation.current++;
        loadingRef.current = false;
      };
    }, [loadPage]),
  );

  return {
    sessions,
    total: pagination.total,
    hasMore: pagination.page < pagination.totalPages,
    loading,
    loadingMore,
    error,
    reload: () => loadPage(1),
    loadMore: () => loadPage(pagination.page + 1),
  };
}
