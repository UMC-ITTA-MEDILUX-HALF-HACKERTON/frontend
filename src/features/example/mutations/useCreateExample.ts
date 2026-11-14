"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { createExample } from "@features/example/api/example.api";

// 생성에 성공하면 example 캐시를 무효화해 서버 값으로 다시 맞춘다.
export function useCreateExample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExample,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.example._def }),
  });
}
