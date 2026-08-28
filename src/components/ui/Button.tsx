import { cn } from "@/lib/utils";
import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

const variants = {
  gold: "bg-gold text-ink border-2 border-ink font-bold shadow-[0_5px_14px_rgb(0_0_0/0.25)] hover:bg-gold-deep hover:-translate-y-0.5 active:translate-y-0",
  dark: "bg-ink text-white font-semibold hover:bg-night-soft hover:-translate-y-0.5 active:translate-y-0",
  outline:
    "border-2 border-ink text-ink font-semibold hover:bg-ink hover:text-white",
  "outline-light":
    "border-2 border-white/70 text-white font-semibold hover:bg-white hover:text-ink",
  ghost: "text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10",
  danger: "bg-danger text-white font-semibold hover:bg-red-700",
} as const;

const sizes = {
  sm: "px-3.5 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-[15px] rounded-xl gap-2",
  lg: "px-7 py-3.5 text-base rounded-xl gap-2.5",
} as const;

type Common = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
  loading?: boolean;
};

const base =
  "inline-flex items-center justify-center transition-all duration-200 whitespace-nowrap select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

export const Button = forwardRef<
  HTMLButtonElement,
  Common & ButtonHTMLAttributes<HTMLButtonElement>
>(function Button({ variant = "gold", size = "md", className, children, loading, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "gold",
  size = "md",
  className,
  children,
  ...props
}: Common & { href: string; onClick?: () => void; target?: string; rel?: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
