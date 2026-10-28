import { useQuery } from '@tanstack/react-query';
import fetchUserReadableKnowledgeArticles from '../services/fetch-user-read-able-knowledge-articles';
import makeKnowledgeArticleCatalogFromFlatArray from '../utils/group-articles-by-category';
import type { KnowledgeArticle, KnowledgeArticlesCatalog } from '../types/knowledge';

function useKnowledgeArticlesWhereUserCanAccessQuery({ getOnlyRecentKbs = false, limit }: { getOnlyRecentKbs?: boolean; limit?: number }) {
    const queryKey = ['knowledge-articles-where-user-can-read', getOnlyRecentKbs];

    const query = useQuery<Array<KnowledgeArticle>, Error, KnowledgeArticlesCatalog>({
        queryKey: [...queryKey],
        queryFn: fetchUserReadableKnowledgeArticles.bind(null, { getOnlyRecentKbs, limit }),
        select: (articles) => makeKnowledgeArticleCatalogFromFlatArray(articles),
    });

    return { ...query, queryKey };
}

export default useKnowledgeArticlesWhereUserCanAccessQuery;
