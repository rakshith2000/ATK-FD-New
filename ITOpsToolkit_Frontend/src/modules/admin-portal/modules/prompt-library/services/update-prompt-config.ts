import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import type { UpdatePromptConfigRequest, UpdatePromptConfigResponse } from '../types/prompt-library';

const updatePromptConfig = async ({ payload }: { payload: UpdatePromptConfigRequest }) => {
    return withApiResponseHandler<UpdatePromptConfigResponse>(async () => {
        if (appConfig.isInDemoEnvironment) {
            return {
                message: appConfig.demoEnvironmentActionMessage,
            };
        }

        const response = await backendApiClient.post(appConfig.backend.api.updateAgentDefination, {
            ...payload,
            // instructions: payload.instruction, // Mapping instruction to instructions for backward compatibility with backend API
        });

        if (response?.data?.output?.message && typeof response?.data?.output?.message === 'string') {
            return { message: response.data.output?.message ?? '' };
        }

        throw new Error('Failed to validate the Updated Agent Definition response from API response JSON Schema !', {
            cause: {
                reason: 'response?.data?.output?.data schemea is invalid !',
            },
        });
    });
};

export default updatePromptConfig;
