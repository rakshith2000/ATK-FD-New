import { useState } from 'react';
import { LoaderCircle, Plus } from 'lucide-react';
import type { MeetingKnowledgeArticle, PushKnowledgeArticleToItsmResponse } from '@/modules/meeting-ai/types/meeting-ai';
import { useMeetingKbCategoriesQuery } from '@/modules/meeting-ai/hooks/useMeetingKbCategoriesQuery';
import { useCreateMeetingKbMutation } from '@/modules/meeting-ai/hooks/useCreateMeetingKbMutation';
import Modal from '@/shared/components/ui/Modal/Modal';
import SelectInput from '@/shared/components/ui/InputFields/SelectInput';
import FieldLabel from '@/shared/components/ui/InputFields/FieldLabel';
import { LoadingPlaceholder, ErrorPlaceholder } from '@/shared/components/ui/Placeholders';
import globalSuccessAlertEventBus from '@/shared/components/smart/GlobalSuccessAlert/global-success-alert-event-bus';

export interface CreateMeetingKbModalProps {
    open: boolean;
    articles?: MeetingKnowledgeArticle[];
    onClose: () => void;
}

const buildPayload = (articles: MeetingKnowledgeArticle[], kbBase: string, category: string) => {
    const allTitles = articles
        .map((a) => a?.title)
        .filter(Boolean)
        .join(' | ');
    const allBodies = articles.map((a) => ({ title: a?.title, content: a?.content }));
    return {
        short_description: allTitles,
        text: JSON.stringify(allBodies),
        kb_knowledge_base: kbBase,
        kb_category: category,
    };
};

const CreateMeetingKbModal: React.FC<CreateMeetingKbModalProps> = ({ open, articles, onClose }) => {
    const [kbBase, setKbBase] = useState('');
    const [category, setCategory] = useState('');
    const [createdKb, setCreatedKb] = useState<PushKnowledgeArticleToItsmResponse | null>(null);

    const {
        data: categories,
        isPending: isCategoriesPending,
        isFetching: isCategoriesFetching,
        isError: isCategoriesError,
        error: categoriesError,
        refetch,
    } = useMeetingKbCategoriesQuery();
    const isCategoriesLoading = isCategoriesPending;
    const createKbMutation = useCreateMeetingKbMutation();

    const handleClose = () => {
        setKbBase('');
        setCategory('');
        setCreatedKb(null);
        createKbMutation.reset();
        onClose();
    };

    const handleSubmit = () => {
        if (!articles?.length || !kbBase || !category) return;
        createKbMutation.mutate(buildPayload(articles, kbBase, category), {
            onSuccess: (data) => {
                setCreatedKb(data);

                globalSuccessAlertEventBus.emit('show-alert', {
                    title: 'Success!',
                    note: `Article ${data.number} created successfully`,
                    buttonText: 'Close',
                    severity: 'brand',
                    buttonClassName: 'w-50!',
                    link: data.target_link
                        ? {
                              href: data.target_link,
                              label: `View Article #${data.number}`,
                              target: '_blank',
                              rel: 'noopener noreferrer',
                          }
                        : undefined,
                });
            },
        });
    };

    const kbBaseOptions = categories ? Object.keys(categories).map((k) => ({ value: k, label: k })) : [];
    const categoryOptions = kbBase && categories?.[kbBase] ? categories[kbBase].map((c) => ({ value: c, label: c })) : [];
    const canSubmit = !!kbBase && !!category && !!articles?.length;

    return (
        <Modal className="pb-5" open={open} onClose={handleClose} size="md" closeOnOutsideClick={!createKbMutation.isPending} closeOnEscapeKeyDown={!createKbMutation.isPending}>
            <Modal.Header className=" p-2 bg-(--brand-color) border-b-(--brand-color) text-(--brand-text-inverse)">
                <Plus size={16} className="text-white" />
                <span className="text-sm font-bold text-white">{createdKb ? 'KB Article Created' : 'Knowledge Article Details'}</span>
            </Modal.Header>

            <Modal.Body className="px-3">
                {isCategoriesLoading ? (
                    <LoadingPlaceholder message="Loading KB categories..." />
                ) : isCategoriesError ? (
                    <ErrorPlaceholder error={categoriesError} onRetry={() => refetch()} />
                ) : (
                    <div className="flex flex-col gap-3 py-2">
                        <div className="flex flex-col gap-1">
                            <FieldLabel label="Knowledge Base" required />
                            <SelectInput
                                options={kbBaseOptions}
                                value={kbBase}
                                onChange={(v) => {
                                    setKbBase(v);
                                    setCategory('');
                                }}
                                isLoading={isCategoriesFetching}
                                onRetry={refetch}
                                onRefetch={refetch}
                                placeholder="Select knowledge base"
                            />
                        </div>
                        {kbBase && (
                            <div className="flex flex-col gap-1">
                                <FieldLabel label="Category" required />
                                <SelectInput
                                    options={categoryOptions}
                                    value={category}
                                    onChange={setCategory}
                                    isLoading={isCategoriesFetching}
                                    onRefetch={refetch}
                                    placeholder="Select category"
                                />
                            </div>
                        )}
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="justify-center">
                {createdKb ? (
                    <Modal.ActionButton onClick={handleClose} className="max-w-32 btn-split split-white-blue-light">
                        Close
                    </Modal.ActionButton>
                ) : (
                    <Modal.ActionButton onClick={handleSubmit} variant="brand" disabled={!canSubmit || createKbMutation.isPending} className="max-w-40">
                        {createKbMutation.isPending && <LoaderCircle size={12} className="animate-spin" />}
                        {createKbMutation.isPending ? 'Creating...' : 'Create KB'}
                    </Modal.ActionButton>
                )}
            </Modal.Footer>
        </Modal>
    );
};

CreateMeetingKbModal.displayName = 'CreateMeetingKbModal';

export default CreateMeetingKbModal;
