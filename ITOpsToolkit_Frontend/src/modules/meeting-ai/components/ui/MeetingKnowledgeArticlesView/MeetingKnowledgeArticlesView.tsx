import { twMerge, type ClassNameValue } from 'tailwind-merge';
import { Archive } from 'lucide-react';
import type { MeetingKnowledgeArticle } from '@/modules/meeting-ai/types/meeting-ai';
import { EmptyPlaceholder } from '@/shared/components/ui/Placeholders';
import RenderMarkdown from '@/shared/components/smart/RenderMarkdown/RenderMarkdown';

export interface MeetingKnowledgeArticlesViewProps {
    articles?: MeetingKnowledgeArticle[];
    onViewArchived?: () => void;
    onCreateKb?: () => void;
    isLoading?: boolean;
    className?: ClassNameValue;
}

const MeetingKnowledgeArticlesView: React.FC<MeetingKnowledgeArticlesViewProps> = ({ articles, onViewArchived, onCreateKb, isLoading, className }) => {
    const hasArticles = !!articles?.length;
    const actionsDisabled = isLoading || !hasArticles;

    return (
        <div className={twMerge('flex flex-col gap-3', className)}>
            <div className="flex gap-2">
                {onViewArchived && (
                    <button
                        type="button"
                        onClick={onViewArchived}
                        disabled={actionsDisabled}
                        className="inline-flex items-center gap-1 btn-split split-white-blue-light rounded soft-drop-shadow px-3 py-1 text-xs font-semibold cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <span className="inline-flex items-center gap-1">
                            <Archive size={12} />
                            View Archived Article
                        </span>
                    </button>
                )}
                {onCreateKb && (
                    <button
                        type="button"
                        onClick={onCreateKb}
                        disabled={actionsDisabled}
                        className="inline-flex items-center gap-1 rounded text-white px-3 py-1 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-transform btn-split split-blue"
                    >
                        <span>Create KB</span>
                    </button>
                )}
            </div>

            {hasArticles ? (
                <div className="flex flex-col gap-2">
                    {articles!.map((article, idx) => (
                        <div key={`${article.title}-${idx}`} className="rounded-md border border-(--brand-border-color) bg-white p-3 brand-box-show-inset">
                            <div className="text-sm font-bold text-black mb-2">{article.title}</div>
                            <RenderMarkdown text={article.content ?? ''} />
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyPlaceholder message="No knowledge articles available" />
            )}
        </div>
    );
};

MeetingKnowledgeArticlesView.displayName = 'MeetingKnowledgeArticlesView';

export default MeetingKnowledgeArticlesView;
