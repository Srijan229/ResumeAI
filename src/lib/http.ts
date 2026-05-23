import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/auth";

export async function requireApiUserId() {
  const userId = await getApiUserId();
  if (!userId) {
    return {
      userId: null,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  return { userId, response: null };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJson<T>(request: Request) {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
