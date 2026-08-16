"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface BulkImportProps {
  onImport: (lines: { name: string; approxPrice: number; quantity: number }[]) => Promise<void>;
}

export function BulkImport({ onImport }: BulkImportProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          name: parts[0] ?? "",
          approxPrice: Number(parts[1] ?? 0),
          quantity: Number(parts[2] ?? 1),
        };
      })
      .filter((l) => l.name);

    if (lines.length === 0) return;
    setLoading(true);
    try {
      await onImport(lines);
      setText("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4">
      <p className="mb-2 text-sm font-medium text-stone-700">Bulk Import</p>
      <p className="mb-2 text-xs text-stone-500">
        One line per item: Name, Price, Quantity
      </p>
      <textarea
        className="mb-2 w-full rounded-lg border border-stone-300 p-2 text-sm"
        rows={4}
        placeholder={"Cheap poncho, 150, 20\nUmbrella X2, 299, 10"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button size="sm" onClick={handleImport} disabled={loading || !text.trim()}>
        {loading ? "Importing..." : "Import Lines"}
      </Button>
    </div>
  );
}
