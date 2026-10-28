import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import { isListKnowledgeBaseCategoriesResponse } from '../type-guard/meeting-ai.guard';

const fetchMeetingKbCategories = async () => {
    return withApiResponseHandler(async () => {
        const response = await backendApiClient.get(appConfig.backend.api.meeting_kb_categories);

        if (response?.data?.output?.data && isListKnowledgeBaseCategoriesResponse(response?.data?.output?.data)) {
            return response?.data?.output?.data;
        } else {
            throw new Error('Unable to retrive KB Categories List  from API Response, failed to validate response JSON Schema !', {
                cause: {
                    reason: 'response?.data?.output?.data schemea is invalid !',
                },
            });
        }
    });
};

export default fetchMeetingKbCategories;
