import serviceNowApiClient from '@/api/axios-clients/service-now-api/service-now-api-client';
import type { KnowledgeArticle } from '../types/knowledge';
import { appConfig } from '@/config/app-config';
import { isKnowledgeArticleArray } from '../type-guards/knowledge.guards';

const fetchKnowledgeArticlesByKnowledgeBaseIds = async ({
    getOnlyRecentKbs,
    knowledgeBaseIds,
    limit,
}: {
    knowledgeBaseIds: Array<string>;
    getOnlyRecentKbs: boolean;
    limit?: number;
}): Promise<Array<KnowledgeArticle>> => {
    let sysparm_query = `workflow_state=published^kb_knowledge_baseIN${knowledgeBaseIds.join(',')}`;

    if (getOnlyRecentKbs) {
        sysparm_query = sysparm_query + '^ORDERBYDESCsys_created_on';
    }

    const response = await serviceNowApiClient.get(appConfig.serviceNow.api.knowledgeTable, {
        params: {
            sysparm_query: sysparm_query,
            sysparm_fields: 'sys_id,rating,number,sys_created_on,text,short_description,kb_knowledge_base,workflow_state,kb_category,author',
            sysparm_display_value: 'all',
            ...(limit ? { sysparm_limit: limit } : {}),
        },
    });

    const results = response?.data?.result;

    if (isKnowledgeArticleArray(results)) {
        return results;
    }

    throw new Error('Unable to retrieve the knowledge articles list from Service Now, failed to validate the response JSON Schema !', {
        cause: {
            reason: 'response?.data?.result schema is invalid !',
        },
    });
};

export default fetchKnowledgeArticlesByKnowledgeBaseIds;
