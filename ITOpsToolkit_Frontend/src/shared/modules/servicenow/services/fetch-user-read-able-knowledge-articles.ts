import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { getAuthProviderInstance } from '@/shared/modules/auth/utils/get-auth-provider-instance';
import type { KnowledgeArticle } from '../types/knowledge';
import fetchSnowUserCriteriaIdsBySysId from './fetch-snow-user-criteria-ids-by-user-sys-id';
import fetchUserReadableKnowledgeBaseIdsByUserCriteria from './fetch-user-readable-knowledge-base-ids-by-user-criteria';
import fetchKnowledgeArticlesByKnowledgeBaseIds from './fetch-knowledge-articles-by-knowledge-base-ids';

const fetchUserReadableKnowledgeArticles = async ({ getOnlyRecentKbs, limit }: { getOnlyRecentKbs: boolean; limit?: number }) => {
    return withApiResponseHandler<Array<KnowledgeArticle>>(async () => {
        const { sys_id: userSysId } = await getAuthProviderInstance().getUserSnowDetails();
        if (!userSysId) return [];

        const userCriteriaIds = await fetchSnowUserCriteriaIdsBySysId(userSysId);
        if (userCriteriaIds.length === 0) return [];

        const knowledgeBaseIds = await fetchUserReadableKnowledgeBaseIdsByUserCriteria(userCriteriaIds);
        if (knowledgeBaseIds.length === 0) return [];

        return fetchKnowledgeArticlesByKnowledgeBaseIds({ knowledgeBaseIds, getOnlyRecentKbs, limit });
    });
};

export default fetchUserReadableKnowledgeArticles;
