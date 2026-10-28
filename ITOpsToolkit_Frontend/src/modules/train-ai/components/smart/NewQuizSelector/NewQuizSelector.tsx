import { useMemo, useState } from 'react';
import { useKbArticlesForQuizQuery } from '../../../hooks/useKbArticlesForQuizQuery';
import { useGenerateQuizMutation } from '../../../hooks/useGenerateQuizMutation';
import CategoryList from '../../ui/CategoryList/CategoryList';
import ArticleCheckboxList from '../../ui/ArticleCheckboxList/ArticleCheckboxList';
import GenerateQuizSuccessModal from '../../ui/GenerateQuizSuccessModal/GenerateQuizSuccessModal';
import { LoadingPlaceholder, ErrorPlaceholder } from '@/shared/components/ui/Placeholders';
import type { GenerateQuizResponse, NewQuizKbArticle } from '../../../types/train-ai';

interface NewQuizSelectorProps {
    searchTerm: string;
    onStartQuiz: (quizId: string, category: string) => void;
}

const NewQuizSelector: React.FC<NewQuizSelectorProps> = ({ searchTerm, onStartQuiz }) => {
    const { data, isLoading, isError, error, isRefetching, refetch } = useKbArticlesForQuizQuery();
    const generateQuizMutation = useGenerateQuizMutation();

    const grouped = useMemo(() => {
        if (!data) return {} as Record<string, NewQuizKbArticle[]>;
        return data.reduce<Record<string, NewQuizKbArticle[]>>((acc, article) => {
            const cat = article.kb_category.display_value?.trim();
            if (!cat) return acc;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(article);
            return acc;
        }, {});
    }, [data]);

    const categories = useMemo(() => Object.keys(grouped).filter((cat) => grouped[cat].length > 0), [grouped]);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
    const [generatedQuiz, setGeneratedQuiz] = useState<GenerateQuizResponse | null>(null);

    const activeCategory = selectedCategory || categories[0] || '';

    const articles = useMemo(() => {
        const categoryArticles = grouped[activeCategory] ?? [];
        if (!searchTerm.trim()) return categoryArticles;
        const term = searchTerm.toLowerCase();
        return categoryArticles.filter((a) => a.short_description.display_value.toLowerCase().includes(term));
    }, [grouped, activeCategory, searchTerm]);

    const handleToggle = (sysId: string) => {
        setSelectedArticles((prev) => (prev.includes(sysId) ? prev.filter((id) => id !== sysId) : [...prev, sysId]));
    };

    const handleGenerateQuiz = () => {
        const kbNumbers = selectedArticles.map((sysId) => data?.find((a) => a.sys_id.value === sysId)?.number.display_value).filter(Boolean) as string[];

        generateQuizMutation.mutate(kbNumbers, {
            onSuccess: (result) => {
                if (result) setGeneratedQuiz(result);
            },
        });
    };

    const handleModalClose = () => {
        setGeneratedQuiz(null);
        setSelectedArticles([]);
    };

    const handleModalStartQuiz = () => {
        if (generatedQuiz) {
            onStartQuiz(generatedQuiz.quiz_id, activeCategory);
        }
        setGeneratedQuiz(null);
        setSelectedArticles([]);
    };

    if (isLoading) {
        return <LoadingPlaceholder message="Loading articles..." />;
    }

    if (isError) {
        return <ErrorPlaceholder error={error} onRetry={() => refetch()} isRefetching={isRefetching} />;
    }

    return (
        <>
            <div className="relative flex flex-col h-full overflow-hidden">
                {generateQuizMutation.isPending && <LoadingPlaceholder overlay message="Generating quiz..." />}
                {/* Two-column content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left — Categories */}
                    <aside className="w-52 shrink-0 overflow-hidden">
                        <CategoryList categories={categories} activeCategory={activeCategory} onSelect={setSelectedCategory} />
                    </aside>

                    {/* Right — Articles */}
                    <main className="flex-1 overflow-auto">
                        <ArticleCheckboxList categoryName={activeCategory} articles={articles} selectedIds={selectedArticles} onToggle={handleToggle} />
                    </main>
                </div>

                {/* Bottom action bar */}
                <div className="shrink-0 flex items-center justify-end gap-2 px-3 py-1.5 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => setSelectedArticles([])}
                        disabled={selectedArticles.length === 0 || generateQuizMutation.isPending}
                        className="px-3 py-1 text-xs font-medium border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        Clear Selection
                    </button>
                    <button
                        type="button"
                        onClick={handleGenerateQuiz}
                        disabled={selectedArticles.length === 0 || generateQuizMutation.isPending}
                        className="px-3 py-1 text-xs font-semibold rounded bg-(--brand-color) text-(--brand-text-inverse) hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
                    >
                        Generate Quiz
                    </button>
                </div>
            </div>

            <GenerateQuizSuccessModal
                isOpen={!!generatedQuiz}
                quizId={generatedQuiz?.quiz_id ?? ''}
                passingThreshold={generatedQuiz?.passing_threshold ?? 70}
                onClose={handleModalClose}
                onStartQuiz={handleModalStartQuiz}
            />
        </>
    );
};

export default NewQuizSelector;
