import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import type { LLMTsListResponse } from '../types/llms';
import { appConfig } from '@/config/app-config';
import { isLLMsListResponse } from '../type-guards/llm-type-guards';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';

const fetchLLMsList = async () => {
    return withApiResponseHandler<LLMTsListResponse>(async () => {
        const response = await backendApiClient.get(appConfig.backend.api.listLLMs);

        if (response?.data?.output?.data && isLLMsListResponse(response?.data?.output?.data)) {
            return response.data.output.data;
        } else {
            throw new Error('Unable to fetch the LLM Tags from API response, failed to validate response JSON Schema !', {
                cause: {
                    reason: 'response?.data?.output?.data schemea is invalid !',
                },
            });
        }
    });
};

export default fetchLLMsList;
