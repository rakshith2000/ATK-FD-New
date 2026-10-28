// import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';
import type { PushChangesRequest, PushChangesResponse } from '../types/change-ai';
import serviceNowApiClient from '@/api/axios-clients/service-now-api/service-now-api-client';
import { isPushChangesResponse } from '../type-guard/change-ai.guard';

const pushChangeRequestToItsm = async (payload: PushChangesRequest): Promise<PushChangesResponse> => {
    return withApiResponseHandler<PushChangesResponse>(async () => {
        const response = await serviceNowApiClient.post(appConfig.serviceNow.api.submitChangeRequest, {
            ...payload,
        });

        if (response?.data?.result && isPushChangesResponse(response?.data?.result)) {
            return response?.data?.result;
        } else {
            throw new Error('Unable to get the Push Change Request response from API !, response?.data?.output?.data schema is invalid !');
        }
    });
};

export default pushChangeRequestToItsm;
