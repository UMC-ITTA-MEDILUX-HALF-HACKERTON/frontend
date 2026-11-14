import { createQueryKeyStore } from "@lukemorales/query-key-factory";

// TanStack Query 키는 여기에서만 만든다. 예: queryKeys.example.detail(id).queryKey
export const queryKeys = createQueryKeyStore({
  example: {
    list: null,
    detail: (id: string) => [id],
  },
});
