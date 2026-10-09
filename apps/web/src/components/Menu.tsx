import { ReactNode, useEffect, useRef, useState } from "react";

interface MenuProps {
  trigger: ReactNode;
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  align?: "left" | "right";
  triggerClassName?: string;
}

/** Lightweight click-outside dropdown. */
export function Menu({ trigger, children, align = "right", triggerClassName }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button
        className={triggerClassName ?? "menu-trigger"}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        type="button"
      >
        {trigger}
      </button>
      {open && (
        <div className={`menu-pop ${align === "left" ? "left" : "right"}`} role="menu">
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
