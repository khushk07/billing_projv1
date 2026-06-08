"use client";

import { Button } from "@/components/ui/Button";
import type { BillLine } from "@/types";

interface BillSummaryProps {
  items: BillLine[];
  onComplete: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  /** Fixed bar at bottom on mobile (billing counter) */
  sticky?: boolean;
}

export function BillSummary({
  items,
  onComplete,
  isSubmitting,
  disabled,
  sticky = false,
}: BillSummaryProps) {
  const total = items.reduce((s, i) => s + i.lineTotal, 0);

  const inner = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-summit-200">Grand Total</p>
        <p className="text-2xl font-bold sm:text-3xl">₹{total}</p>
        <p className="text-xs text-summit-300">{items.length} item(s)</p>
      </div>
      <Button
        size="lg"
        onClick={onComplete}
        disabled={disabled || isSubmitting || items.length === 0}
        className="min-h-[48px] w-full bg-white text-summit-800 hover:bg-summit-100 sm:w-auto"
      >
        {isSubmitting ? "Processing..." : "Complete Sale"}
      </Button>
    </div>
  );

  if (sticky) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-summit-700 bg-summit-800 px-4 py-3 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] safe-bottom lg:static lg:rounded-lg lg:border-0 lg:px-6 lg:py-4 lg:shadow-none">
        {inner}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-summit-800 px-4 py-4 text-white sm:px-6">
      {inner}
    </div>
  );
}
