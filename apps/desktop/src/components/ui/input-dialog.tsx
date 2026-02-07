"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface InputDialogProps {
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  validator?: (value: string) => string | null; // Returns error message or null
}

export function InputDialog({
  title,
  placeholder = "",
  defaultValue = "",
  onConfirm,
  onCancel,
  validator,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleConfirm = useCallback(() => {
    if (validator) {
      const errorMsg = validator(value);
      if (errorMsg) {
        setError(errorMsg);
        return;
      }
    }
    onConfirm(value);
  }, [value, validator, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [handleConfirm, onCancel],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      if (error) {
        setError(null);
      }
    },
    [error],
  );

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-foreground/30"
          onClick={onCancel}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.12 }}
          className="relative z-10 w-full max-w-sm border border-foreground bg-background text-foreground shadow-[3px_3px_0_var(--foreground)]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border">
            <h3 id={titleId} className="text-sm font-medium">{title}</h3>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full px-3 py-2 text-sm border outline-none transition-colors ${
                error
                  ? "border-red-500 focus:border-red-600"
                  : "border-border focus:border-foreground"
              }`}
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600"
              >
                {error}
              </motion.p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
            <button type="button" onClick={onCancel} className="btn btn-sm btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleConfirm} className="btn btn-sm btn-primary">
              Confirm
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
