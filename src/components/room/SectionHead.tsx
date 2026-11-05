import type { ReactNode } from "react";

interface SectionHeadProps {
  id: string;
  title: string;
  meta?: ReactNode;
}

export function SectionHead({ id, title, meta }: SectionHeadProps) {
  return (
    <div className="flex items-baseline justify-between border-b border-ink pb-2">
      <h2 id={id} className="text-sm font-semibold">
        {title}
      </h2>
      {meta ? <span className="text-sm text-mute">{meta}</span> : null}
    </div>
  );
}

interface AddInputProps {
  id: string;
  label: string;
  placeholder: string;
  maxLength: number;
  onSubmit: (text: string) => void;
}

export function AddInput({ id, label, placeholder, maxLength, onSubmit }: AddInputProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("text") as HTMLInputElement;
        const text = input.value.trim();
        if (!text) return;
        onSubmit(text);
        input.value = "";
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name="text"
        autoComplete="off"
        maxLength={maxLength}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
        className="w-full border-b border-line bg-transparent py-3 text-[15px] outline-none transition-colors focus:border-ink"
      />
    </form>
  );
}
