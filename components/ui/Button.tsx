import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-summit-600 text-white hover:bg-summit-700 focus:ring-summit-500",
  secondary:
    "bg-stone-200 text-stone-800 hover:bg-stone-300 focus:ring-stone-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  ghost: "bg-transparent text-stone-700 hover:bg-stone-100",
};

const sizes: Record<Size, string> = {
  sm: "min-h-[40px] px-3 py-1.5 text-sm",
  md: "min-h-[44px] px-4 py-2 text-sm",
  lg: "min-h-[48px] px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";
