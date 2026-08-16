"use client";

import { Modal } from "@/components/ui/Modal";
import { ProductForm } from "./ProductForm";
import type { StockLogItem } from "@/types";

interface PromoteModalProps {
  entry: StockLogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPromoted: (catalogueData: Record<string, unknown>, stockLogId: string) => Promise<void>;
}

export function PromoteModal({
  entry,
  isOpen,
  onClose,
  onPromoted,
}: PromoteModalProps) {
  if (!entry) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Promote to Catalogue" wide>
      <ProductForm
        initialData={{
          name: entry.name,
          category: entry.category,
          subcategory: entry.subcategory,
          sellingPrice: entry.lastUsedPrice || entry.approxPrice,
          stockQuantity: entry.quantity,
        }}
        submitLabel="Add to Catalogue"
        onCancel={onClose}
        onSubmit={async (data) => {
          await onPromoted(data, entry.id);
          onClose();
        }}
      />
    </Modal>
  );
}
