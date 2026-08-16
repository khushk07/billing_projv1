import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

/**
 * Builds a consistent JSON API response.
 */
export function jsonResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success, data, error },
    { status: success ? status : status === 200 ? 400 : status }
  );
}
