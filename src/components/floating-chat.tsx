"use client";

import {
  Check,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage, SessionUser } from "@/lib/types";

type FloatingChatProps = {
  user: SessionUser | null;
};

const formatMessageTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));

const mergeMessages = (current: ChatMessage[], incoming: ChatMessage[]) => {
  const merged = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => merged.set(message.id, message));
  return [...merged.values()]
    .sort(
      (a, b) =>
        Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
        a.id.localeCompare(b.id),
    )
    .slice(-100);
};

export function FloatingChat({ user }: FloatingChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const openRef = useRef(open);
  const cursorRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const fetchMessages = useCallback(async () => {
    try {
      const query = cursorRef.current
        ? `?after=${encodeURIComponent(cursorRef.current)}`
        : "";
      const response = await fetch(`/api/chat/messages${query}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("채팅을 불러오지 못했습니다.");

      const payload = (await response.json()) as {
        messages: ChatMessage[];
      };
      if (payload.messages.length) {
        setMessages((current) => mergeMessages(current, payload.messages));
        cursorRef.current =
          payload.messages[payload.messages.length - 1].createdAt;
        if (initialized.current && !openRef.current) {
          setUnread((current) =>
            Math.min(
              99,
              current +
                payload.messages.filter((message) => !message.isMine).length,
            ),
          );
        }
      }
      initialized.current = true;
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "채팅을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMessages();
    const interval = window.setInterval(() => {
      void fetchMessages();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, open]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = (await response.json()) as {
        message?: ChatMessage;
        error?: string;
      };
      if (!response.ok || !payload.message) {
        throw new Error(payload.error || "메시지 전송에 실패했습니다.");
      }

      setMessages((current) => mergeMessages(current, [payload.message!]));
      cursorRef.current = payload.message.createdAt;
      setDraft("");
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "메시지 전송에 실패했습니다.",
      );
    } finally {
      setSending(false);
    }
  };

  const toggleChat = () => {
    const nextOpen = !open;
    openRef.current = nextOpen;
    setOpen(nextOpen);
    if (nextOpen) setUnread(0);
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 md:bottom-7 md:right-7">
      {open && (
        <section className="mb-3 flex h-[min(68vh,560px)] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-[24px] border border-[#dce3dc] bg-white shadow-[0_24px_80px_rgba(11,45,34,0.24)]">
          <header className="flex items-center justify-between bg-[#0b4937] px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#c9ff3d] text-[#113d2e]">
                <MessageCircle size={18} strokeWidth={2.5} />
              </span>
              <div>
                <h2 className="display text-sm font-bold">CHATTING</h2>
              </div>
            </div>
            <button
              aria-label="채팅 닫기"
              className="grid size-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
          </header>

          <div
            className="scrollbar-none flex-1 space-y-3 overflow-y-auto bg-[#f4f6f1] px-4 py-4"
            ref={scrollRef}
          >
            {loading && (
              <div className="grid h-full place-items-center text-[#7c8881]">
                <LoaderCircle className="animate-spin" size={22} />
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-[#e3ece0] text-[#315f4b]">
                    <Users size={21} />
                  </span>
                  <p className="text-sm font-bold text-[#435149]">
                    첫 메시지를 남겨보세요
                  </p>
                  <p className="mt-1 text-[11px] text-[#8a958f]">
                    경기 이야기와 예측을 함께 나눌 수 있어요.
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                className={`flex ${message.isMine ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                <div className={`max-w-[82%] ${message.isMine ? "text-right" : ""}`}>
                  {!message.isMine && (
                    <div className="mb-1 flex items-center gap-1.5 px-1">
                      <span className="grid size-5 place-items-center rounded-full bg-[#dbe8d9] text-[8px] font-extrabold text-[#28523f]">
                        {message.user.name.slice(0, 1)}
                      </span>
                      <span className="text-[10px] font-bold text-[#536159]">
                        {message.user.name}
                      </span>
                      {message.user.grade && message.user.classNumber && (
                        <span className="text-[9px] text-[#919b95]">
                          {message.user.grade}-{message.user.classNumber}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-left text-xs leading-5 shadow-sm ${
                      message.isMine
                        ? "rounded-br-md bg-[#174b38] text-white"
                        : "rounded-bl-md bg-white text-[#35443c]"
                    }`}
                  >
                    {message.content}
                  </div>
                  <p className="mt-1 px-1 text-[9px] text-[#9aa39e]">
                    {formatMessageTime(message.createdAt)}
                    {message.isMine && (
                      <Check className="ml-1 inline text-[#4c8069]" size={10} />
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="border-t border-[#eadfd9] bg-[#fff3ed] px-4 py-2 text-[10px] font-semibold text-[#a24c34]">
              {error}
            </p>
          )}

          {user ? (
            <form
              className="border-t border-[#e6ebe5] bg-white p-3"
              onSubmit={sendMessage}
            >
              <div className="flex items-end gap-2 rounded-2xl bg-[#f2f4ef] p-1.5 pl-3">
                <textarea
                  aria-label="채팅 메시지"
                  className="max-h-24 min-h-9 flex-1 resize-none bg-transparent py-2 text-xs leading-5 outline-none placeholder:text-[#a0aaa4]"
                  maxLength={300}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="메시지를 입력하세요"
                  rows={1}
                  value={draft}
                />
                <button
                  aria-label="메시지 보내기"
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#174b38] text-white transition hover:bg-[#0d3427] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!draft.trim() || sending}
                  type="submit"
                >
                  {sending ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
              <p className="mt-1.5 px-1 text-right text-[9px] text-[#a0aaa4]">
                {draft.length}/300
              </p>
            </form>
          ) : (
            <div className="border-t border-[#e6ebe5] bg-white p-3">
              <a
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#174b38] py-3 text-xs font-bold text-white"
                href="/api/auth/login"
              >
                <ShieldCheck size={14} />
                DataGSM 로그인 후 참여
              </a>
            </div>
          )}
        </section>
      )}

      <button
        aria-label={open ? "채팅 닫기" : "채팅 열기"}
        className="relative ml-auto grid size-14 place-items-center rounded-full bg-[#0b4937] text-white shadow-[0_12px_35px_rgba(11,73,55,0.32)] transition hover:-translate-y-0.5 hover:bg-[#07382a] md:size-16"
        onClick={toggleChat}
        type="button"
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
        {!open && unread > 0 && (
          <span className="display absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border-2 border-[#f4f5f0] bg-[#ff6137] px-1 py-0.5 text-[9px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
