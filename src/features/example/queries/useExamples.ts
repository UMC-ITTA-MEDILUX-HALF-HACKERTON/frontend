"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { getExamples } from "@features/example/api/example.api";

export function useExamples() {
  return useQuery({
    queryKey: queryKeys.example.list.queryKey,
    queryFn: ({ signal }) => getExamples(signal),
  });
}
