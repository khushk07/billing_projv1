"use client";

import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface CustomerLookupProps {
  name: string;
  phone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  isReturning?: boolean;
}

export function CustomerLookup({
  name,
  phone,
  onNameChange,
  onPhoneChange,
  isReturning,
}: CustomerLookupProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-stone-800">Customer</h3>
        {isReturning && <Badge variant="success">Returning customer</Badge>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          placeholder="Customer name"
        />
        <Input
          label="Phone (10 digits)"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          required
          placeholder="9876543210"
          maxLength={10}
        />
      </div>
    </div>
  );
}
