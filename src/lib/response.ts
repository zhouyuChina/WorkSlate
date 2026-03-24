import { NextResponse } from "next/server";

export function success<T>(data: T, message = "success") {
  return NextResponse.json({ code: 0, message, data });
}

export function error(code: number, message: string, status = 400) {
  return NextResponse.json({ code, message, data: null }, { status });
}

export function list<T>(items: T[], total: number) {
  return success({ items, total });
}
