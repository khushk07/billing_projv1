/**
 * /api/customers/[id]
 * GET — customer by id with their sales
 * Response: { success, data: { customer, sales }, error? }
 */

import { getCustomerById } from "@/lib/customersService";
import { getSalesByCustomerId } from "@/lib/salesService";
import { jsonResponse } from "@/lib/apiResponse";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await getCustomerById(params.id);
    if (!customer) {
      return jsonResponse(false, undefined, "Customer not found", 404);
    }
    const sales = await getSalesByCustomerId(params.id);
    return jsonResponse(true, { customer, sales });
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}
