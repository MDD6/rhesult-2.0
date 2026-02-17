import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });

  response.cookies.set({
    name: "rhesult_token",
    value: "",
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
