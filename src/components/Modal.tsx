"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import Icon from "./Icon";

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  headerAction,
  children,
  width = 460,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    
    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-2.5 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-[#05071c]/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="glass-strong relative z-10 flex flex-col max-h-[90vh] w-[95vw] sm:max-h-[86vh] sm:w-[calc(100vw-1.25rem)] overflow-hidden rounded-[24px] sm:rounded-[28px]"
            style={{ maxWidth: width }}
          >
            <div className="shrink-0 flex items-start justify-between gap-4 p-4 sm:p-6 pb-2 sm:pb-4">
              <div>
                <h2 className="text-[22px] font-bold leading-tight">{title}</h2>
                {subtitle && (
                  <p className="mt-1 text-[13px] text-[var(--text-dim)]">
                    {subtitle}
                  </p>
                )}
              </div>
              {headerAction && <div className="flex items-center gap-3 shrink-0 ml-4">{headerAction}</div>}
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/8 text-[var(--text-dim)] transition hover:bg-white/15 hover:text-white"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-slim p-4 sm:p-6 pt-2 sm:pt-2">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
