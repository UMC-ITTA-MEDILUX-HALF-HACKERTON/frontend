"use client";

import { useState } from "react";

import { MemberAvatar } from "@features/room/components/MemberAvatar/MemberAvatar";
import { cn } from "@common/utils/cn";
import type { Member } from "@features/room/types/room.types";
import { formatClock } from "@features/room/utils/time";

// 정하기 탭의 대화 화면. 지금은 화면만 있고 백엔드와 연결하지 않는다 (백엔드에서 웹소켓을 할지, 채팅이 없을지 미정).
// 보낸 메시지는 이 화면 안에서만 보이고 새로고침하면 사라진다.
// TODO(백엔드 확정 후): 채팅이 생기면 messages 를 서버 데이터로 바꾸고 send 를 API 호출로 바꾼다.

interface ChatMessage {
  id: string;
  authorId: string | null; // null 이면 시스템 메시지
  text: string;
  at: string; // ISO
}

const QUICK_REPLIES = ["👍 좋아", "🤷 아무거나", "🏃 거의 다 왔어"];

// 화면 확인용 예시 대화 (디자인과 같은 내용). 참가자가 부족하면 있는 사람으로 채운다.
function sampleMessages(members: Member[], meId: string | null): ChatMessage[] {
  const others = members.filter((m) => m.id !== meId);
  const a = others.find((m) => m.nickname === "철수") ?? others[0];
  const b = others.find((m) => m.nickname === "지수") ?? others[1] ?? others[0];
  const base = Date.now();
  const at = (minutesAgo: number) => new Date(base - minutesAgo * 60_000).toISOString();
  const list: ChatMessage[] = [];
  if (a) list.push({ id: "s1", authorId: a.id, text: "포차 가자 거기 안주 맛있음", at: at(5) });
  if (b) list.push({ id: "s2", authorId: b.id, text: "노래방 가고 싶은데🎤", at: at(3) });
  if (meId) list.push({ id: "s3", authorId: meId, text: "나도 노래방 한 표!", at: at(1) });
  return list;
}

export function ChatPanel({
  members,
  meId,
  confirmedNotice,
}: {
  members: Member[];
  meId: string | null;
  // 후보가 확정되면 대화 맨 아래에 보여 줄 안내 (예: "민지님이 '코인노래방'으로 확정했어요")
  confirmedNotice: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => sampleMessages(members, meId));
  const [draft, setDraft] = useState("");

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !meId) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `u${prev.length}-${Date.now()}`,
        authorId: meId,
        text: trimmed,
        at: new Date().toISOString(),
      },
    ]);
    setDraft("");
  }

  const memberOf = (id: string | null) => members.findIndex((m) => m.id === id);

  return (
    <section aria-label="대화" className="flex flex-1 flex-col">
      <ul className="flex flex-1 flex-col justify-end gap-3 px-5 pt-6 pb-3">
        {messages.map((message) => {
          const mine = message.authorId === meId;
          const index = memberOf(message.authorId);
          const author = members[index];
          return (
            <li
              key={message.id}
              className={cn("flex flex-col", mine ? "items-end" : "items-start")}
            >
              {!mine && author ? (
                <span className="text-sub mb-1 ml-10 text-[11px]">{author.nickname}</span>
              ) : null}
              <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                {!mine && author ? (
                  <MemberAvatar nickname={author.nickname} index={index} size="sm" />
                ) : null}
                <p
                  className={cn(
                    "max-w-[220px] rounded-2xl px-3.5 py-2.5 text-[13px] font-medium",
                    mine ? "bg-primary rounded-br-md text-white" : "bg-fill rounded-bl-md",
                  )}
                >
                  {message.text}
                </p>
                <span className="text-sub text-[10px]">{formatClock(message.at)}</span>
              </div>
            </li>
          );
        })}
        {confirmedNotice ? (
          <li className="flex justify-center">
            <span className="bg-mint-soft text-mint-ink rounded-full px-3 py-1.5 text-[11px] font-bold">
              ✅ {confirmedNotice}
            </span>
          </li>
        ) : null}
      </ul>

      <div className="sticky bottom-0 bg-white pb-5">
        <div className="flex gap-2 overflow-x-auto px-4 pb-2">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => send(reply.replace(/^\S+\s/, ""))}
              disabled={!meId}
              className="bg-fill shrink-0 rounded-full px-3 py-2 text-xs font-bold disabled:opacity-50"
            >
              {reply}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
          className="flex items-center gap-2 px-4"
        >
          <button
            type="button"
            aria-label="더하기"
            disabled
            className="bg-fill text-sub flex size-10 shrink-0 items-center justify-center rounded-full text-xl"
          >
            +
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="메시지 보내기"
            aria-label="메시지"
            maxLength={200}
            className="bg-fill placeholder:text-disabled h-10 min-w-0 flex-1 rounded-full px-4 text-sm outline-none"
          />
          <button
            type="submit"
            aria-label="보내기"
            disabled={!draft.trim() || !meId}
            className="bg-primary flex size-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
          >
            ↑
          </button>
        </form>
      </div>
    </section>
  );
}
