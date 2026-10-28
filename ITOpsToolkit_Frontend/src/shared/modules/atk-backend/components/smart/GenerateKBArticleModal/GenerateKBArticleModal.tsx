import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, Check, CheckCircle, ClipboardCopy, ExternalLink, LoaderCircle, Pencil, Save, Undo2 } from 'lucide-react';
import Modal, { type ModalProps } from '@/shared/components/ui/Modal/Modal';
import RichTextEditor, { RichTextEditorToolbar, RichTextEditorContent, type RichTextEditorActions } from '@/shared/modules/rich-text-editor';
import CreateKBArticleForm from '../../../../servicenow/components/smart/CreateKBArticleForm/CreateKBArticleForm';
import GoBackButton from '@/shared/components/ui/GoBackButton/GoBackButton';
import { useQueryClient } from '@tanstack/react-query';
import RenderMarkdown from '@/shared/components/smart/RenderMarkdown/RenderMarkdown';
import { useGeneratedKnowledgeArticleMutation } from '@/shared/modules/atk-backend/hooks/useGeneratedKnowledgeArticleMutation';
import { useCopyText } from '@/shared/hooks/useCopyText';
import { useConfirmUnsavedChanges } from '@/shared/hooks/useConfirmUnsavedChanges';
import type { IssueWithoutKBArticle } from '../../../types/knowledge-base';
import getServiceNowLink from '@/shared/modules/servicenow/utils/get-service-now-link';
import type { CreateKnowledgeArticleResposne } from '@/shared/modules/servicenow/types/knowledge';

interface GenerateKBArticleModalProps {
    issue: IssueWithoutKBArticle | null;
    onClose: () => void;
}

type ActiveTab = 'ticket' | 'editor' | 'save-form' | 'success';

const displayValue = (value: string | null | undefined) => value?.trim() || '--';

const HEADER_TITLES: Record<ActiveTab, string> = {
    ticket: 'Ticket Details',
    editor: 'Article Details',
    'save-form': 'Create KB Article',
    success: 'Article Created',
};

const MODEL_SIZES: Record<ActiveTab, ModalProps['size']> = {
    ticket: '7xl',
    editor: '7xl',
    'save-form': 'lg',
    success: 'md',
};

const GenerateKBArticleModal: React.FC<GenerateKBArticleModalProps> = ({ issue, onClose }) => {
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<ActiveTab>('ticket');
    const [generatedArticleHtml, setGeneratedArticleHtml] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [savedArticle, setSavedArticle] = useState<CreateKnowledgeArticleResposne | null>(null);
    const editorActionsRef = useRef<RichTextEditorActions>(null);
    const { copied: htmlCopied, copy: copyHtml } = useCopyText(5000);

    const unsavedGuard = useConfirmUnsavedChanges();

    const generateKbArticleMutation = useGeneratedKnowledgeArticleMutation();

    const isGenerateKbArticleMutationPending = generateKbArticleMutation.isPending;
    const canCloseFreely = ['success', 'ticket'].includes(activeTab) && !isGenerateKbArticleMutationPending && !isEditing && !generatedArticleHtml;

    const resetState = useCallback(() => {
        setGeneratedArticleHtml(null);
        setSavedArticle(null);
        setIsEditing(false);
        setActiveTab('ticket');
        generateKbArticleMutation.reset();
    }, []);

    const handleClose = useCallback(async () => {
        if (await unsavedGuard.confirm(!canCloseFreely)) {
            resetState();
            onClose();
        }
    }, [canCloseFreely, resetState, onClose, unsavedGuard]);

    const handleRefineArticle = useCallback(() => {
        if (!issue) return;

        generateKbArticleMutation.mutate(
            { description: issue.description, short_description: issue.short_description, resolution_notes: issue.close_notes, work_notes_and_comments: issue.work_notes },
            {
                onSuccess: (data) => {
                    setGeneratedArticleHtml(data.generated_article);
                    setActiveTab('editor');
                },
            },
        );
    }, [issue]);

    const handleSaveEditedContent = useCallback((html: string) => {
        setGeneratedArticleHtml(html);
        setIsEditing(false);
    }, []);

    return (
        <>
            <Modal className="p-0" size={MODEL_SIZES[activeTab]} open={!!issue} onClose={handleClose} closeOnEscapeKeyDown={canCloseFreely} closeOnOutsideClick={canCloseFreely}>
                <Modal.Header className="p-2 mb-0 bg-(--brand-color) border-b-(--brand-color) text-(--brand-text-inverse) font-semibold text-sm 2xl:text-base">
                    {HEADER_TITLES[activeTab]}
                </Modal.Header>
                <Modal.Body>
                    {/* Ticket Details */}
                    {activeTab === 'ticket' && (
                        <div className="w-full bg-white px-2 py-3 flex flex-col gap-4 text-sm text-(--brand-issue-title-color)">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-sm">Ticket ID: {displayValue(issue?.number)}</span>
                                <span className="font-semibold text-sm">Category : {displayValue(issue?.category)}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-xs">Short Description</span>
                                <span className="text-xs text-(--brand-text-gray)">{displayValue(issue?.short_description)}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-xs">Description</span>
                                <span className="text-xs text-(--brand-text-gray)">{displayValue(issue?.description)}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-xs">Resolution Notes</span>
                                <span className="text-xs text-(--brand-text-gray)">
                                    <RenderMarkdown text={displayValue(issue?.close_notes)} />
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Article Editor */}
                    {activeTab === 'editor' && generatedArticleHtml && (
                        <RichTextEditor
                            initialHtml={generatedArticleHtml}
                            isEditable={isEditing}
                            onEditableChange={setIsEditing}
                            onSave={handleSaveEditedContent}
                            actionsRef={editorActionsRef}
                            extensions={{
                                textCase: false,
                            }}
                            preserveInitialHtml={{
                                classes: true,
                                head: true,
                                styles: true,
                            }}
                            className="border-none w-full shadow-none rounded-none my-0 pl-2 pt-0"
                        >
                            <RichTextEditorToolbar className="" />
                            <RichTextEditorContent className="min-h-20 max-h-[70dvh]" />
                        </RichTextEditor>
                    )}

                    {/* Save Form */}
                    {activeTab === 'save-form' && (
                        <div className="w-full bg-white px-6 py-5">
                            <GoBackButton onClick={() => setActiveTab('editor')} title="Back to Editor" />
                            <CreateKBArticleForm
                                shortDescription={generateKbArticleMutation?.data?.title ?? issue?.short_description ?? ''}
                                articleText={editorActionsRef.current?.getHtml() ?? generatedArticleHtml ?? ''}
                                onSubmitSuccess={async (data) => {
                                    setSavedArticle(data);
                                    setActiveTab('success');
                                    setGeneratedArticleHtml(null);
                                    queryClient.refetchQueries({
                                        queryKey: ['issuesWithoutKbsQuery'],
                                    });
                                }}
                            />
                        </div>
                    )}

                    {/* Success */}
                    {activeTab === 'success' && savedArticle && (
                        <div className="w-full bg-white px-6 py-8 flex flex-col items-center gap-4 text-sm">
                            <div className="flex items-center justify-center size-14 rounded-full bg-blue-100">
                                <CheckCircle size={32} className="text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-semibold text-blue-700">Success !</h3>
                            <div className="flex flex-col items-center gap-4 text-md font-bold text-(--brand-text-gray)">
                                <span>Article #{savedArticle.number} Created Sucessfully</span>
                                {savedArticle.sys_id && (
                                    <a
                                        href={getServiceNowLink({ sysId: savedArticle.sys_id, type: 'kb_knowledge' })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:underline"
                                    >
                                        <ExternalLink size={12} />
                                        View Article #{savedArticle.number}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="p-1 pb-2 justify-center">
                    {/* Footer - ticket tab */}
                    {activeTab === 'ticket' && (
                        <Modal.ActionButton onClick={handleRefineArticle} variant="brand" className="max-w-50" disabled={isGenerateKbArticleMutationPending}>
                            {isGenerateKbArticleMutationPending && <LoaderCircle size={12} className="animate-spin" />}
                            {isGenerateKbArticleMutationPending ? 'Generating...' : 'Generate Article'}
                        </Modal.ActionButton>
                    )}

                    {/* Footer - editor tab */}
                    {activeTab === 'editor' && (
                        <>
                            {isEditing ? (
                                <>
                                    <Modal.ActionButton onClick={() => editorActionsRef.current?.discard()} variant="secondary" className="max-w-40">
                                        <Undo2 size={12} />
                                        Discard Changes
                                    </Modal.ActionButton>
                                    <Modal.ActionButton onClick={() => editorActionsRef.current?.save()} variant="brand" className="max-w-40">
                                        <Save size={12} />
                                        Update Changes
                                    </Modal.ActionButton>
                                </>
                            ) : (
                                <>
                                    <Modal.ActionButton onClick={() => setIsEditing(true)} variant="brand" className="max-w-40">
                                        <Pencil size={12} />
                                        Edit
                                    </Modal.ActionButton>
                                    <Modal.ActionButton onClick={() => setActiveTab('save-form')} variant="brand" className="max-w-40">
                                        <Save size={12} />
                                        Save Article
                                    </Modal.ActionButton>
                                    <Modal.ActionButton
                                        onClick={() => {
                                            const html = editorActionsRef.current?.copyHtml() ?? '';
                                            if (html) copyHtml(html);
                                        }}
                                        variant="ghost"
                                        className="w-[50%] max-w-40"
                                        disabled={htmlCopied}
                                    >
                                        {htmlCopied ? <Check size={12} className="text-green-600" /> : <ClipboardCopy size={12} />}
                                        {htmlCopied ? 'Copied!' : 'Copy HTML'}
                                    </Modal.ActionButton>
                                </>
                            )}
                        </>
                    )}

                    {/* No footer for save-form tab - form has its own submit button */}

                    {/* Footer - success tab */}
                    {activeTab === 'success' && (
                        <Modal.ActionButton onClick={handleClose} variant="brand" className="max-w-40">
                            Close
                        </Modal.ActionButton>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Warning */}
            <Modal size="xs" open={unsavedGuard.isOpen} closeOnEscapeKeyDown={false} closeOnOutsideClick={false} className="p-4">
                <Modal.Body className="text-center">
                    <div className="flex flex-col items-center text-center pt-2">
                        <div className="flex items-center justify-center size-11 rounded-full bg-red-50">
                            <AlertTriangle size={22} className="text-red-400" />
                        </div>
                        <h2 className="text-sm font-medium text-gray-800">
                            {isGenerateKbArticleMutationPending ? 'Article Generation In Progress' : isEditing ? 'Unsaved Changes' : 'Article Not Saved'}
                        </h2>
                    </div>
                    {isGenerateKbArticleMutationPending
                        ? 'KB article is still being generated. This action will discard the result. Are you sure?'
                        : isEditing
                          ? 'You have unsaved changes in the editor. This action will discard those changes. Are you sure?'
                          : 'Generated KB article has not been saved yet. This action will discard it. Are you sure?'}
                </Modal.Body>

                <Modal.Footer className="flex-row">
                    <Modal.ActionButton variant="danger" onClick={unsavedGuard.proceed}>
                        Discard & Proceed
                    </Modal.ActionButton>
                    <Modal.ActionButton variant="brand" onClick={unsavedGuard.cancel}>
                        Stay
                    </Modal.ActionButton>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default GenerateKBArticleModal;
