import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';
import type { MergedKnowledgeArticleResponse } from '../types';
import { isMergedKnowledgeArticleResponse } from '../type-guards';

const mergeKnowledgeArticles = async (articles: Record<string, string>): Promise<MergedKnowledgeArticleResponse> => {
    return withApiResponseHandler<MergedKnowledgeArticleResponse>(async () => {
        const response = await backendApiClient.post(appConfig.backend.api.mergeKbArticles, {
            ...articles,
        });

        if (response?.data?.output?.data && isMergedKnowledgeArticleResponse(response?.data?.output?.data)) {
            return response?.data?.output?.data;
        } else {
            throw new Error('Unable to get the Merged article details, failed to validate response JSON Schema !', {
                cause: {
                    reason: 'response?.data?.output?.data schema is invalid',
                },
            });
        }
    });
};

export default mergeKnowledgeArticles;
