type BadgeVariant =
  | "default"
  | "catalogue"
  | "stocklog"
  | "warning"
  | "danger"
  | "success";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-stone-200 text-stone-700",
  catalogue: "bg-emerald-100 text-emerald-800",
  stocklog: "bg-amber-100 text-amber-800",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-800",
  success: "bg-green-100 text-green-800",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
