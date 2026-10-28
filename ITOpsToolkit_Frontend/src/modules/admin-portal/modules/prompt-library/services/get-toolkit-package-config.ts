import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import type { GetToolkitPackageConfigRequest, GetToolkitPackageConfigResponse } from '../types/prompt-library';
import { isGetToolkitPackageConfigResponse } from '../type-guards/prompt-library.guards';

const getToolkitPackageConfig = async ({ payload }: { payload: GetToolkitPackageConfigRequest }) => {
    return withApiResponseHandler<GetToolkitPackageConfigResponse>(async () => {
        const response = await backendApiClient.post(appConfig.backend.api.getToolkitPackageConfig, {
            ...payload,
        });

        const data = response?.data?.output?.data;

        if (data && isGetToolkitPackageConfigResponse(data)) {
            return data;
        }

        throw new Error('Failed to validate the Get Toolkit Package Config response from API response JSON Schema !', {
            cause: {
                reason: 'response?.data?.output?.data schema is invalid !',
            },
        });
    });
};

export default getToolkitPackageConfig;
