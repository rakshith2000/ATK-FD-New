import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import type { LiteLLMProxy } from '../types/lite-llm-proxy';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import { isLiteLLMProxy } from '../type-guards/lite-llm-proxy-guards';

const fetchLiteLLMProxyList = async () => {
    return withApiResponseHandler<LiteLLMProxy>(async () => {
        const response = await backendApiClient.get(appConfig.backend.api.listLiteLLMProxies);

        if (response?.data?.output?.data) {
            if (Object.keys(response?.data?.output?.data).length === 0) return {};
            if (isLiteLLMProxy(response.data.output.data)) {
                return response.data.output.data;
            }
        }

        throw new Error('Failed to validate the Lite LLM Proxy from API response JSON Schema !', {
            cause: {
                reason: 'response?.data?.output?.data schemea is invalid !',
            },
        });
    });
};

export default fetchLiteLLMProxyList;
