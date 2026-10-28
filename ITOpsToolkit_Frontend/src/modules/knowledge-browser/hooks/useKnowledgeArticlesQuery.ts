import { useQuery } from '@tanstack/react-query';
import fetchKnowledgeArticles from '../services/fetch-knowledge-articles';
import type { KnowledgeArticle, KnowledgeBrowserCatalog } from '../types/knowledge-browser';
import groupArticlesByCategory from '../utils/group-articles-by-category';

export function useKnowledgeArticlesQuery() {
    const queryKey = ['knowledgeBrowserArticles'];

    const query = useQuery<Array<KnowledgeArticle>, Error, KnowledgeBrowserCatalog>({
        queryKey: queryKey,
        queryFn: fetchKnowledgeArticles,
        retry: false,
        enabled: true,
        staleTime: 5 * 60 * 1000,
        select: (articles) => groupArticlesByCategory(articles),
    });

    return { ...query, queryKey };
}
