import { isServer, QueryClient } from "@tanstack/react-query";

// 서버에서는 요청마다 새로 만들고(요청 사이에 데이터가 섞이지 않게), 브라우저에서는 하나를 재사용한다.
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
