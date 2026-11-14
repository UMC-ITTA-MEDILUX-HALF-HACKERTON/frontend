"use client";

import { useState } from "react";

import { Button } from "@common/components/Button";
import { TextField } from "@common/components/TextField/TextField";
import { btn } from "@common/utils/button-class";
import { type PlaceResult, usePlaceSearch } from "@features/room/queries/usePlaceSearch";

interface PlaceSearchFieldProps {
  // 입력창에 보이는 장소 이름
  value: string;
  // 직접 고쳐 쓰면 이전에 고른 좌표는 무효가 된다
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  // 검색 결과에서 고른 장소가 있는지
  selected: boolean;
  error?: string;
}

// 약속 장소를 카카오 장소 검색으로 고른다. 백엔드가 장소 좌표(lat, lng)를 요구해서 검색 결과를 골라야 한다.
// 입력할 때마다 검색하지 않고, 검색 버튼이나 Enter 로 검색한다.
export function PlaceSearchField({
  value,
  onChange,
  onSelect,
  selected,
  error,
}: PlaceSearchFieldProps) {
  const [submitted, setSubmitted] = useState("");
  const search = usePlaceSearch(submitted);

  function runSearch() {
    setSubmitted(value.trim());
  }

  const showResults = submitted.length >= 2 && !selected;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="약속 장소"
            placeholder="📍 강남역, ○○포차"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              runSearch();
            }}
            error={error}
            hint={
              selected
                ? "장소 반경 100m 안에 들어오면 '장소 근처'로 표시돼요"
                : "검색해서 장소를 골라 주세요"
            }
            maxLength={50}
          />
        </div>
        <Button
          type="button"
          variant="soft"
          className={btn({ size: "md", className: "mb-6" })}
          onClick={runSearch}
        >
          검색
        </Button>
      </div>
      {showResults ? (
        <ul className="border-line divide-line divide-y overflow-hidden rounded-2xl border">
          {search.isFetching ? (
            <li className="text-sub px-4 py-3 text-sm">검색하는 중...</li>
          ) : search.isError ? (
            <li className="text-coral px-4 py-3 text-sm">장소를 검색하지 못했어요.</li>
          ) : search.data?.length ? (
            search.data.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => onSelect(place)}
                  className="hover:bg-fill w-full px-4 py-3 text-left"
                >
                  <p className="text-sm font-bold">{place.name}</p>
                  <p className="text-sub text-xs">{place.address}</p>
                </button>
              </li>
            ))
          ) : (
            <li className="text-sub px-4 py-3 text-sm">검색 결과가 없어요.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
