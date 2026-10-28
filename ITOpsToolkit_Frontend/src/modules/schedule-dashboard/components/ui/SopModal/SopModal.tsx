import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal/Modal';

interface SopModalProps {
    open: boolean;
    onClose: () => void;
    sopDetails: { name: string; content: string } | null;
}

export const SopModal: React.FC<SopModalProps> = ({ open, onClose, sopDetails }) => {
    const formattedSopContent = useMemo(() => {
        if (!sopDetails?.content) return null;
        return sopDetails.content.split('\n').map((line, index) => {
            if (line.trim().match(/^(Step \d+|Resolution Step|Pre-requisite):/i)) {
                return (
                    <p key={index} className="text-[var(--brand-title-primary-color)] font-bold text-sm mt-3 mb-1">
                        {line}
                    </p>
                );
            }
            if (line.trim().startsWith('*')) {
                return (
                    <li key={index} className="text-slate-600 text-xs ml-4 list-disc pl-1">
                        {line.substring(1).trim()}
                    </li>
                );
            }
            return (
                <p key={index} className="text-slate-600 text-xs leading-relaxed">
                    {line}
                </p>
            );
        });
    }, [sopDetails?.content]);

    return (
        <Modal open={open} size="3xl" onClose={onClose}>
            <Modal.Header>
                <span className="text-[var(--brand-title-primary-color)] font-bold flex items-center gap-2">
                    <FileText size={18} className="text-[var(--brand-title-primary-color)]" />
                    {sopDetails?.name ?? 'SOP Content Blueprint'}
                </span>
            </Modal.Header>

            <Modal.Body className="p-4 border border-[rgba(187,221,255,0.6)] shadow-[inset_0px_0px_20px_0px_rgba(89,172,255,0.302)] rounded-xl space-y-2">
                {formattedSopContent}
            </Modal.Body>

            <Modal.Footer className="justify-end pt-2 bg-slate-50/60 rounded-b-lg">
                <Modal.ActionButton variant="brand" onClick={onClose} className="max-w-[100px]">
                    Close
                </Modal.ActionButton>
            </Modal.Footer>
        </Modal>
    );
};
