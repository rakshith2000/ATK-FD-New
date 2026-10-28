import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import type { DuplicateKBCatalog } from '../types';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import { isDuplicateKBCatalog } from '../type-guards';

const fetchDuplicateKnowledgeArticles = async () => {
    return withApiResponseHandler<DuplicateKBCatalog>(async () => {
        const response = await backendApiClient.get(appConfig.backend.api.listDuplicateKnowledgeArticles);

        if (response?.data?.output?.data && isDuplicateKBCatalog(response?.data?.output?.data)) {
            return response?.data?.output?.data;
        } else {
            throw new Error('Unable to retrive the duplicate kb articles are from API response, failed to validate response JSON Schema !', {
                cause: {
                    reason: 'response?.data?.output?.data schemea is invalid !',
                },
            });
        }
    });
};

export default fetchDuplicateKnowledgeArticles;
