import { cn } from "@/lib/utils";
import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";

const fieldClass =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] text-ink placeholder:text-muted/70 transition-shadow focus:border-gold focus:ring-2 focus:ring-gold/40 focus:outline-none disabled:opacity-60 dark:bg-night-soft dark:border-night-line dark:text-white aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldClass, className)} {...props} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldClass, "min-h-28", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(fieldClass, "appearance-none", className)} {...props}>
        {children}
      </select>
    );
  }
);

export function Label({
  htmlFor,
  children,
  required,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-sm font-semibold text-ink dark:text-white", className)}
    >
      {children}
      {required && (
        <span className="text-danger" aria-hidden>
          {" "}
          *
        </span>
      )}
    </label>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm font-medium text-danger">
      {message}
    </p>
  );
}
