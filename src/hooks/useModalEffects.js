import { useEffect } from "react";

export function useModalEffects(
  isOpen,
  setOpen,
  closedValue = false,
  canCloseOnEscape = true,
) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && canCloseOnEscape) {
        setOpen(closedValue);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setOpen, closedValue, canCloseOnEscape]);
}
