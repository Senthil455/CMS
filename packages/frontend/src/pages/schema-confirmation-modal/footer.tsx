import { Check } from 'lucide-react';

interface ModalFooterProps {
    onClose: () => void;
    onConfirm: () => void;
}

export function ModalFooter({ onClose, onConfirm }: ModalFooterProps) {
    return (
        <div className="p-6 border-t border-border bg-app-muted/30 flex justify-end gap-3 rounded-b-2xl">
            <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-app-muted transition-colors text-primary-muted hover:text-primary"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="px-5 py-2.5 bg-primary text-app rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
                <Check className="w-4 h-4" />
                Confirm & Apply
            </button>
        </div>
    );
}
