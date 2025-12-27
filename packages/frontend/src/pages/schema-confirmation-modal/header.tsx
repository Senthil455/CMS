import { X, FileJson } from 'lucide-react';

interface ModalHeaderProps {
    onClose: () => void;
}

export function ModalHeader({ onClose }: ModalHeaderProps) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <FileJson className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold tracking-tight">Confirm Schema Changes</h2>
                    <p className="text-xs text-primary-muted font-medium">Review proposed changes before applying</p>
                </div>
            </div>
            <button
                onClick={onClose}
                className="p-2 hover:bg-app-muted rounded-full transition-colors text-primary-muted hover:text-primary"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}
