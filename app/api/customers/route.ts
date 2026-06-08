/**
 * /api/customers
 * GET — all customers, or single by ?phone=9876543210
 * Response: { success, data?, error? }
 */

import { NextRequest } from "next/server";
import { getAllCustomers, getCustomerByPhone } from "@/lib/customersService";
import { jsonResponse } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get("phone");
    if (phone) {
      const customer = await getCustomerByPhone(phone);
      return jsonResponse(true, customer);
    }
    const customers = await getAllCustomers();
    return jsonResponse(true, customers);
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}
