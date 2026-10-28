import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import type { LLM } from '../types/llms';
import { appConfig } from '@/config/app-config';
import { isLLMArray } from '../type-guards/llm-type-guards';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';

const fetchLLMsListConfig = async () => {
    return withApiResponseHandler<Array<LLM>>(async () => {
        const response = await backendApiClient.get(appConfig.backend.api.listLLMsWithConfig);

        if (response?.data?.output?.data && isLLMArray(response?.data?.output?.data)) {
            return response.data.output.data;
        } else {
            throw new Error('Unable to fetch the LLMs with Config from API response, failed to validate response JSON Schema !', {
                cause: {
                    reason: 'response?.data?.output?.data schemea is invalid !',
                },
            });
        }
    });
};

export default fetchLLMsListConfig;
