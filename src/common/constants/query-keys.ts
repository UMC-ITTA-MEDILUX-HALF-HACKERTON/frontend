import { createQueryKeyStore } from "@lukemorales/query-key-factory";

// TanStack Query 키는 여기에서만 만든다. 예: queryKeys.room.detail(roomId).queryKey
export const queryKeys = createQueryKeyStore({
  example: {
    list: null,
    detail: (id: string) => [id],
  },
  place: {
    search: (query: string) => [query],
  },
  room: {
    detail: (roomId: string) => [roomId],
    byCode: (code: string) => [code],
    candidates: (roomId: string) => [roomId],
    gameResult: (roomId: string) => [roomId],
    locations: (roomId: string) => [roomId],
  },
});
