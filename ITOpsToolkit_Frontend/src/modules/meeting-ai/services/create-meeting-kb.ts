import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import { isPushKnowledgeArticleToItsmResponse } from '../type-guard/meeting-ai.guard';
import type { PushKnowledgeArticleToItsmRequest, PushKnowledgeArticleToItsmResponse } from '../types/meeting-ai';

const createMeetingKb = async ({ short_description, text, kb_knowledge_base, kb_category }: PushKnowledgeArticleToItsmRequest) => {
    return withApiResponseHandler<PushKnowledgeArticleToItsmResponse>(async () => {
        const response = await backendApiClient.post(appConfig.backend.api.meeting_kb_creation, {
            short_description,
            text,
            kb_knowledge_base,
            kb_category,
        });

        if (response?.data?.output?.data && isPushKnowledgeArticleToItsmResponse(response?.data?.output?.data)) {
            return response?.data?.output?.data;
        } else {
            throw new Error('Unable to Create KB from API Response, failed to validate response JSON Schema !', {
                cause: {
                    reason: 'response?.data?.output?.data schemea is invalid !',
                },
            });
        }
    });
};

export default createMeetingKb;
