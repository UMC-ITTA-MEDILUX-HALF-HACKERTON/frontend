"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { getExample } from "@features/example/api/example.api";

export function useExample(id: string) {
  return useQuery({
    queryKey: queryKeys.example.detail(id).queryKey,
    queryFn: ({ signal }) => getExample(id, signal),
  });
}
