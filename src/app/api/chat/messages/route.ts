import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChatMessage, SessionUser } from "@/lib/types";
import { upsertUser } from "@/lib/users";

const MAX_MESSAGE_LENGTH = 300;
const MESSAGE_COOLDOWN_MS = 1000;

function serializeMessage(
  message: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      datagsmId: string;
      name: string;
      grade: number | null;
      classNumber: number | null;
    };
  },
  session: SessionUser | null,
): ChatMessage {
  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    isMine: session?.id === message.user.datagsmId,
    user: {
      name: message.user.name,
      grade: message.user.grade ?? undefined,
      classNumber: message.user.classNumber ?? undefined,
    },
  };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  const afterValue = request.nextUrl.searchParams.get("after");
  const after = afterValue ? new Date(afterValue) : null;

  if (after && Number.isNaN(after.getTime())) {
    return NextResponse.json(
      { error: "잘못된 after 값입니다." },
      { status: 400 },
    );
  }

  const messages = await db.chatMessage.findMany({
    where: after ? { createdAt: { gt: after } } : undefined,
    include: {
      user: {
        select: {
          datagsmId: true,
          name: true,
          grade: true,
          classNumber: true,
        },
      },
    },
    orderBy: { createdAt: after ? "asc" : "desc" },
    take: after ? 100 : 50,
  });
  const ordered = after ? messages : messages.reverse();

  return NextResponse.json({
    messages: ordered.map((message) => serializeMessage(message, session)),
    serverTime: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const content =
    typeof body.content === "string"
      ? body.content.replace(/\s+/g, " ").trim()
      : "";
  if (!content) {
    return NextResponse.json(
      { error: "메시지를 입력하세요." },
      { status: 400 },
    );
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `메시지는 ${MAX_MESSAGE_LENGTH}자까지 입력할 수 있습니다.` },
      { status: 400 },
    );
  }

  const user = await upsertUser(session);
  const latest = await db.chatMessage.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (
    latest &&
    Date.now() - latest.createdAt.getTime() < MESSAGE_COOLDOWN_MS
  ) {
    return NextResponse.json(
      { error: "메시지는 1초에 한 번만 보낼 수 있습니다." },
      { status: 429 },
    );
  }

  const message = await db.chatMessage.create({
    data: { userId: user.id, content },
    include: {
      user: {
        select: {
          datagsmId: true,
          name: true,
          grade: true,
          classNumber: true,
        },
      },
    },
  });

  return NextResponse.json(
    { message: serializeMessage(message, session) },
    { status: 201 },
  );
}
