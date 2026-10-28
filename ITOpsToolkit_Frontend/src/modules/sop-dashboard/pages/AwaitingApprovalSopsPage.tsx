import { useState } from 'react';
import SopApprovalBaseTemplate from '../components/SopApprovalBaseTemplate';
import type { SopCardData } from '../components/SopApprovalBaseTemplate';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Modal from '@/shared/components/ui/Modal/Modal';
import { FaClipboardList } from 'react-icons/fa';

import { useSOPQueries } from '../hooks/useSOPQueries';
import { useDeleteSOPMutation } from '../hooks/useDeleteSOPMutation';
import { useApproveSOPMutation } from '../hooks/useApproveSOPMutation';
import type { SOP } from '../types/sop';

export default function AwaitingApprovalSopsPage() {
    const { sopsQuery, allAwaitingApprovalSops } = useSOPQueries();
    const deleteMutation = useDeleteSOPMutation();
    const approveMutation = useApproveSOPMutation();

    const [sopToDelete, setSopToDelete] = useState<SOP | null>(null);
    const [sopToApprove, setSopToApprove] = useState<SOP | null>(null);

    const mappedSops: SopCardData[] = allAwaitingApprovalSops.map((sop) => ({
        id: String(sop.id),
        title: sop.sop_name,
        author: sop.created_by ?? 'Unknown Creator',
        status: 'Awaiting Approval',
        category: sop.category as SopCardData['category'],
        sop_content: sop.sop_content,
        sop_type: (sop as unknown as { sop_type?: string }).sop_type,
        u_sop_type: (sop as unknown as { u_sop_type?: string }).u_sop_type,
    }));

    if (sopsQuery.isLoading) {
        return <div className="p-6 text-gray-600 dark:text-gray-300 font-medium animate-pulse">Loading pending SOPs...</div>;
    }

    if (sopsQuery.isError) {
        return <div className="p-6 text-red-500 font-medium">Error loading pending SOPs</div>;
    }

    const handleConfirmDelete = () => {
        if (sopToDelete) {
            deleteMutation.mutate(sopToDelete, {
                onSettled: () => setSopToDelete(null),
            });
        }
    };

    const handleConfirmApprove = () => {
        if (sopToApprove) {
            approveMutation.mutate(sopToApprove, {
                onSettled: () => setSopToApprove(null),
            });
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
            {(deleteMutation.isPending || approveMutation.isPending) && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-[#011a80] text-white text-center py-2.5 text-sm font-semibold shadow-md animate-pulse tracking-wide">
                    {approveMutation.isPending
                        ? 'Synchronizing vector embeddings and transferring data to Available SOP matrix...'
                        : 'Synchronizing vector indexes and removing records...'}
                </div>
            )}

            {mappedSops.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                    <div className="text-gray-300 dark:text-gray-700 text-6xl mb-4 flex items-center justify-center">
                        <FaClipboardList />
                    </div>
                    <h5 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No SOPs awaiting approval</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">All clear! There are no pending requests in this category.</p>
                </div>
            ) : (
                <SopApprovalBaseTemplate
                    pageTitle="SOPs Awaiting Approval"
                    items={mappedSops}
                    showSidebar={true}
                    onRefresh={() => sopsQuery.refetch()}
                    isRefreshing={sopsQuery.isFetching}
                    onApprove={(sopItem) => {
                        const originalSop = allAwaitingApprovalSops.find((s) => String(s.id) === sopItem.id);
                        if (originalSop) {
                            setSopToApprove(originalSop);
                        }
                    }}
                    onDelete={(id) => {
                        const targetSop = allAwaitingApprovalSops.find((s) => String(s.id) === id);
                        if (targetSop) {
                            setSopToDelete(targetSop);
                        }
                    }}
                />
            )}

            <DeleteConfirmationModal
                isOpen={Boolean(sopToDelete)}
                title="Delete Pending SOP"
                itemName={sopToDelete?.sop_name ?? ''}
                isDeleting={deleteMutation.isPending}
                onClose={() => setSopToDelete(null)}
                onConfirm={handleConfirmDelete}
            />

            <Modal
                open={Boolean(sopToApprove)}
                onClose={() => !approveMutation.isPending && setSopToApprove(null)}
                size="md"
                className="p-0 overflow-hidden rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
                <Modal.Header className="p-6 border-b border-gray-100 dark:border-gray-700 bg-[#f8fafd] dark:bg-gray-800/50">
                    <h2 className="text-base font-bold text-[#011a80] dark:text-white m-0">Confirm Approval</h2>
                </Modal.Header>

                <Modal.Body className="p-6 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-0">
                    <p>
                        Are you sure you want to approve <strong>{sopToApprove?.sop_name}</strong>?
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">This will update the approval status and Vectorized SOP content.</p>
                </Modal.Body>

                <Modal.Footer className="p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 items-center rounded-b-3xl">
                    <button
                        type="button"
                        disabled={approveMutation.isPending}
                        onClick={() => setSopToApprove(null)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={approveMutation.isPending}
                        onClick={handleConfirmApprove}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#2a9619] hover:bg-[#1e6b12] shadow-sm transition-all flex items-center justify-center min-w-[90px] disabled:opacity-50 cursor-pointer"
                    >
                        {approveMutation.isPending ? <span className="flex items-center gap-1.5 animate-pulse">Approving...</span> : 'Approve'}
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
