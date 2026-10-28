import { useState } from 'react';
import SopBaseTemplate from '../components/SopBaseTemplate';
import type { SopCardData } from '../components/SopBaseTemplate';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { FaClipboardList } from 'react-icons/fa';

import { useSOPQueries } from '../hooks/useSOPQueries';
import { useDeleteSOPMutation } from '../hooks/useDeleteSOPMutation';
import { useNavigate } from '@tanstack/react-router';
import type { SOP } from '../types/sop';

export default function AiGeneratedSopsPage() {
    const { sopsQuery, aiPendingSops } = useSOPQueries();
    const deleteMutation = useDeleteSOPMutation();
    const navigate = useNavigate();
    const [sopToDelete, setSopToDelete] = useState<SOP | null>(null);
    const mappedSops: SopCardData[] = aiPendingSops.map((sop) => ({
        id: String(sop.id),
        title: sop.sop_name,
        author: sop.created_by ?? 'AI Engine',
        status: 'Awaiting Approval',
        category: sop.category as SopCardData['category'],
        sop_content: sop.sop_content,
    }));

    if (sopsQuery.isLoading) {
        return <div className="p-6 text-gray-600 dark:text-gray-300 font-medium animate-pulse"></div>;
    }

    if (sopsQuery.isError) {
        return <div className="p-6 text-red-500 font-medium">Error loading SOPs</div>;
    }

    const handleConfirmDelete = () => {
        if (sopToDelete) {
            deleteMutation.mutate(sopToDelete, {
                onSettled: () => setSopToDelete(null),
            });
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
            {deleteMutation.isPending && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 text-sm font-semibold shadow-md animate-pulse">
                    Synchronizing vector indexes and removing records...
                </div>
            )}

            {mappedSops.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                    <div className="text-gray-300 dark:text-gray-700 text-6xl mb-4 flex items-center justify-center">
                        <FaClipboardList />
                    </div>
                    <h5 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No AI Pending SOPs found</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">All clear! There are no pending AI requests in this category.</p>
                </div>
            ) : (
                <SopBaseTemplate
                    pageTitle="AI Generated SOPs"
                    items={mappedSops}
                    showSidebar={true}
                    onEnhance={(sopItem) => {
                        const originalSop = aiPendingSops.find((s) => String(s.id) === sopItem.id);

                        navigate({
                            to: '/faste-ai/sop-dashboard/sop-generator',
                            state: (prev) =>
                                ({
                                    ...prev,
                                    enhanceContent: `Enhancing By ATE\n\n${sopItem.sop_content ?? ''}`,
                                    sopData: originalSop || sopItem,
                                }) as Record<string, unknown>,
                        });
                    }}
                    onDelete={(id) => {
                        const targetSop = aiPendingSops.find((s) => String(s.id) === id);
                        if (targetSop) {
                            setSopToDelete(targetSop);
                        }
                    }}
                />
            )}

            <DeleteConfirmationModal
                isOpen={Boolean(sopToDelete)}
                title="Delete AI Generated SOP"
                itemName={sopToDelete?.sop_name ?? ''}
                isDeleting={deleteMutation.isPending}
                onClose={() => setSopToDelete(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
