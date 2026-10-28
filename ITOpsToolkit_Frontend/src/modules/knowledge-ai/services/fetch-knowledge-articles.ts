import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import type { KnowledgeArticle_From_List_API } from '../types';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import { isKnowledgeArticle_From_List_API_Array } from '../type-guards';

const fetchKnowledgeArticles = async () => {
    return withApiResponseHandler<Array<KnowledgeArticle_From_List_API>>(async () => {
        const response = await backendApiClient.get(appConfig.backend.api.listKnowledgeArticles);

        if (response?.data?.output?.data && isKnowledgeArticle_From_List_API_Array(response?.data?.output?.data)) {
            return response?.data?.output?.data;
        } else {
            throw new Error('Unable to retrive the knowledge articles list from API response, failed to validate the response JSON Schema !', {
                cause: {
                    reason: 'response?.data?.output?.data schemea is invalid !',
                },
            });
        }
    });
};

export default fetchKnowledgeArticles;
