import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';
import { isDraftChangeResponse } from '../type-guard/change-ai.guard';
import type { DraftChangeRequest, DraftChangeResponse } from '../types/change-ai';

const draftChange = async (payload: DraftChangeRequest): Promise<DraftChangeResponse> => {
    return withApiResponseHandler<DraftChangeResponse>(async () => {
        const response = await backendApiClient.post(appConfig.backend.api.draftChange, {
            ...payload,
        });

        if (response?.data?.output?.data && isDraftChangeResponse(response?.data?.output?.data)) {
            return response?.data?.output?.data;
        } else {
            throw new Error('Unable to get the Draft Change response from API !, response?.data?.output?.data schema is invalid !');
        }
    });
};

export default draftChange;
