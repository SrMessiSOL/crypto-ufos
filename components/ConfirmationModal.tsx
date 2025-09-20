import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalUfos: number;
  resource: string;
  amount: number;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalUfos,
  resource,
  amount,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus modal when opened for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <Card
        ref={modalRef}
        className="w-[90%] max-w-[400px] bg-[#1a1a1a]/95 border-[#00ffaa] rounded-xl shadow-2xl p-6 glow-hover fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <h2 id="modal-title" className="text-2xl font-bold text-[#ff00aa] mb-4 glitch-pulse">
          Confirm Trade
        </h2>
        <p className="text-[#00ffaa] mb-2">
          You are about to trade <span className="font-semibold">{amount.toLocaleString()}</span>{" "}
          {resource} for <span className="font-semibold">{totalUfos.toLocaleString()}</span> UFOS.
        </p>
        <p className="text-[#00ffaa] mb-6">Do you want to proceed?</p>
        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="cypherpunk-button cypherpunk-button-red text-white rounded-lg px-4 py-2 glow-hover"
            aria-label="Cancel trade"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="cypherpunk-button cypherpunk-button-blue text-white rounded-lg px-4 py-2 glow-hover"
            aria-label="Confirm trade"
          >
            Confirm
          </Button>
        </div>
      </Card>
      <style jsx>{`
        .transform {
          transform: translate(-50%, -50%);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        .fixed.top-1/2.left-1/2.transform {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ConfirmationModal;