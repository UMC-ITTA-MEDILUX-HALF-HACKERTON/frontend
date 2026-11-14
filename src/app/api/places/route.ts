// 장소 검색 프록시. 카카오 로컬 API(키워드 검색)를 서버에서 호출해 REST 키가 브라우저에 노출되지 않게 한다.
// 필요한 환경변수: NEXT_KAKAO_MAP_KEY (카카오 REST API 키. NEXT_PUBLIC_ 접두사가 없어 서버에서만 읽힌다)

const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const MAX_RESULTS = 8;

interface KakaoDocument {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  // 카카오는 x 가 경도(lng), y 가 위도(lat) 이다.
  x: string;
  y: string;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams.get("query")?.trim() ?? "";
  if (query.length < 2) return json({ places: [] });

  const key = process.env.NEXT_KAKAO_MAP_KEY;
  if (!key) return json({ message: "장소 검색이 설정되지 않았습니다." }, 503);

  const url = new URL(KAKAO_KEYWORD_URL);
  url.searchParams.set("query", query.slice(0, 50));
  url.searchParams.set("size", String(MAX_RESULTS));

  let response: Response;
  try {
    response = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } });
  } catch {
    return json({ message: "장소를 검색하지 못했습니다." }, 502);
  }
  if (!response.ok) return json({ message: "장소를 검색하지 못했습니다." }, 502);

  const body = (await response.json()) as { documents?: KakaoDocument[] };
  const places = (body.documents ?? []).flatMap((doc) => {
    const lat = Number(doc.y);
    const lng = Number(doc.x);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    return [
      {
        id: doc.id,
        name: doc.place_name,
        address: doc.road_address_name || doc.address_name,
        lat,
        lng,
      },
    ];
  });
  return json({ places });
}
