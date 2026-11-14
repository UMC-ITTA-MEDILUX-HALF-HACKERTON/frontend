"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// 장소 검색. 카카오 키가 브라우저에 나가지 않도록 우리 서버의 /api/places 를 거친다.
export function usePlaceSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.place.search(query).queryKey,
    queryFn: async ({ signal }): Promise<PlaceResult[]> => {
      const response = await fetch(`/api/places?query=${encodeURIComponent(query)}`, { signal });
      if (!response.ok) throw new Error("장소를 검색하지 못했어요.");
      const body = (await response.json()) as { places: PlaceResult[] };
      return body.places;
    },
    enabled: query.length >= 2,
    staleTime: 60_000,
    retry: false,
  });
}
