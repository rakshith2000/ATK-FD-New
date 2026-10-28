import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import type { UpdateToolkitPackageConfigRequest, UpdateToolkitPackageConfigResponse } from '../types/prompt-library';

const updateToolkitPackageConfig = async ({ payload }: { payload: UpdateToolkitPackageConfigRequest }) => {
    return withApiResponseHandler<UpdateToolkitPackageConfigResponse>(async () => {
        if (appConfig.isInDemoEnvironment) {
            return {
                message: appConfig.demoEnvironmentActionMessage,
            };
        }

        const response = await backendApiClient.post(appConfig.backend.api.updateToolkitPackageConfig, {
            ...payload,
        });

        if (response?.data?.output?.message && typeof response?.data?.output?.message === 'string') {
            return { message: response.data.output?.message ?? '' };
        }

        throw new Error('Failed to validate the Update Toolkit Package Config response from API response JSON Schema !', {
            cause: {
                reason: 'response?.data?.output?.data schemea is invalid !',
            },
        });
    });
};

export default updateToolkitPackageConfig;
