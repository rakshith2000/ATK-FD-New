import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import type { DeleteITSMConnectorResponse, DeleteITSMConnectorRequest } from '../types/itsm-connectors';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';

const deleteItsmConnector = async ({ payload }: { payload: DeleteITSMConnectorRequest }) => {
    return withApiResponseHandler<DeleteITSMConnectorResponse>(async () => {
        if (appConfig.isInDemoEnvironment) {
            return {
                message: appConfig.demoEnvironmentActionMessage,
            };
        }

        const response = await backendApiClient.post(appConfig.backend.api.deleteITSMConnector, {
            ...payload,
        });

        if (response?.data?.output?.message && typeof response?.data?.output?.message === 'string') {
            return { message: response.data.output?.message ?? '' };
        }

        throw new Error('Failed to validate the Delete ITSM Connector response from API response JSON Schema !', {
            cause: {
                reason: 'response?.data?.output?.message schemea is invalid !',
            },
        });
    });
};

export default deleteItsmConnector;
