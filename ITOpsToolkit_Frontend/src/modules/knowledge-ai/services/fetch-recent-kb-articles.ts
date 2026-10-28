import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import type { RecentKBArticle } from '../types';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import { isRecentKBArray } from '../type-guards';

const fetchRecentKbArticles = async () => {
    return withApiResponseHandler<Array<RecentKBArticle>>(async () => {
        const response = await backendApiClient.get(appConfig.backend.api.listRecentKbArticles);

        if (response?.data?.output?.data && isRecentKBArray(response?.data?.output?.data)) {
            return response?.data?.output?.data;
        } else {
            throw new Error('Unable to fetch the Recent KB"s from API response, failed to validate response JSON Schema !', {
                cause: {
                    reason: 'response?.data?.output?.data schemea is invalid !',
                },
            });
        }
    });
};

export default fetchRecentKbArticles;
