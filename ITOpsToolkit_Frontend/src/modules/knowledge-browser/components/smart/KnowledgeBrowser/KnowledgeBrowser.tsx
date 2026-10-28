import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ErrorPlaceholder, EmptyPlaceholder, LoadingPlaceholder } from '@/shared/components/ui/Placeholders';
import { useKnowledgeArticlesQuery } from '../../../hooks/useKnowledgeArticlesQuery';
import type { KnowledgeArticle } from '../../../types/knowledge-browser';
import { getArticleKey } from '../../../utils/article-format';
import KnowledgeCategoryListItem from '../../ui/KnowledgeCategoryListItem/KnowledgeCategoryListItem';
import KnowledgeArticleCard from '../../ui/KnowledgeArticleCard/KnowledgeArticleCard';
import KnowledgeArticleDetailModal from '../../ui/KnowledgeArticleDetailModal/KnowledgeArticleDetailModal';
import KnowledgeArticleRefineModal from '../KnowledgeArticleRefineModal/KnowledgeArticleRefineModal';

interface KnowledgeBrowserProps {
    /** Optional category to pre-select on first load (e.g. when navigated from Knowledge AI). */
    initialCategory?: string;
}

const KnowledgeBrowser: React.FC<KnowledgeBrowserProps> = ({ initialCategory }) => {
    const query = useKnowledgeArticlesQuery();
    const categories = query.data?.categories ?? [];

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
    const [refiningArticle, setRefiningArticle] = useState<KnowledgeArticle | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categorySearchTerm, setCategorySearchTerm] = useState('');

    // Pick a default category once data arrives: honour initialCategory if it exists, else the first category.
    useEffect(() => {
        if (selectedCategory || categories.length === 0) return;
        const match = initialCategory && categories.find((c) => c.category === initialCategory);
        setSelectedCategory(match ? match.category : categories[0].category);
    }, [categories, initialCategory, selectedCategory]);

    const activeGroup = categories.find((c) => c.category === selectedCategory) ?? null;

    const term = searchTerm.trim().toLowerCase();
    const visibleArticles = !term
        ? (activeGroup?.articles ?? [])
        : (activeGroup?.articles ?? []).filter((article) =>
              [article.number?.display_value, article.short_description?.display_value, article.author?.display_value].some((field) => field?.toLowerCase().includes(term)),
          );

    const categoryTerm = categorySearchTerm.trim().toLowerCase();
    const visibleCategories = !categoryTerm ? categories : categories.filter((group) => group.category.toLowerCase().includes(categoryTerm));

    if (query.isLoading) return <LoadingPlaceholder message="Loading knowledge articles" />;
    if (query.isError) return <ErrorPlaceholder error={query.error} onRetry={() => query.refetch()} isRefetching={query.isRefetching} />;
    if (categories.length === 0) return <EmptyPlaceholder message="No knowledge articles found" onRetry={() => query.refetch()} isRefetching={query.isRefetching} />;

    return (
        <div className="grid h-full w-full grid-cols-1 gap-2 p-2 lg:grid-cols-[240px_1fr] lg:overflow-hidden">
            {/* Left - Categories */}
            <aside className="flex min-h-0 flex-col rounded-lg border border-gray-200 bg-white shadow-xs">
                {/* Category search */}
                <div className="flex-none p-2">
                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={categorySearchTerm}
                            onChange={(e) => setCategorySearchTerm(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-8 text-xs text-gray-600 outline-none transition-colors focus:border-(--brand-title-primary-color)"
                        />
                        {categorySearchTerm && (
                            <button
                                type="button"
                                onClick={() => setCategorySearchTerm('')}
                                aria-label="Clear category search"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category list */}
                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2 pt-0">
                    {visibleCategories.length === 0 ? (
                        <p className="px-2 py-3 text-center text-xs text-gray-400">No categories found</p>
                    ) : (
                        visibleCategories.map((group) => (
                            <KnowledgeCategoryListItem
                                key={group.categoryId}
                                category={group.category}
                                count={group.articlesCount}
                                isSelected={group.category === selectedCategory}
                                onSelect={setSelectedCategory}
                            />
                        ))
                    )}
                </div>
            </aside>

            {/* Right - Articles */}
            <section className="flex min-h-0 flex-col gap-2 overflow-hidden">
                {/* Header - count badge + search */}
                <div className="flex flex-none items-center justify-between gap-2">
                    <span className="rounded-md bg-(--brand-title-primary-color) px-3 py-1.5 text-xs font-semibold text-white">
                        {selectedCategory} Count: {activeGroup?.articlesCount ?? 0}
                    </span>
                    <div className="relative w-full max-w-xs">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search articles..."
                            className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-8 text-xs text-gray-600 outline-none transition-colors focus:border-(--brand-title-primary-color)"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                aria-label="Clear article search"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Articles grid */}
                <div className="min-h-0 flex-1 overflow-y-auto rounded-lg">
                    {visibleArticles.length === 0 ? (
                        <EmptyPlaceholder message={searchTerm ? 'No articles match your search' : 'No articles in this category'} />
                    ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {visibleArticles.map((article) => (
                                <KnowledgeArticleCard key={getArticleKey(article)} article={article} onSelect={setSelectedArticle} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Article detail popup */}
            <KnowledgeArticleDetailModal
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
                onRefine={(article) => {
                    setSelectedArticle(null);
                    setRefiningArticle(article);
                }}
            />

            {/* Refined article details popup */}
            <KnowledgeArticleRefineModal article={refiningArticle} onClose={() => setRefiningArticle(null)} />
        </div>
    );
};

export default KnowledgeBrowser;
