import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import type { GetITSMConnectorConfigRequest, ITSMConnectorConfig } from '../types/itsm-connectors';
import { isITSMConnectorConfig } from '../type-guards/istm-connectors.guards';

const getITSMConnectorConfig = async ({ payload }: { payload: GetITSMConnectorConfigRequest }) => {
    return withApiResponseHandler<ITSMConnectorConfig>(async () => {
        const response = await backendApiClient.post(appConfig.backend.api.getITSMConnectorConfig, {
            ...payload,
        });

        if (response?.data?.output?.data && isITSMConnectorConfig(response.data.output.data)) {
            return response.data.output.data;
        }

        throw new Error('Failed to validate the GET ITSM connector Config response from API response JSON Schema !', {
            cause: {
                reason: 'response?.data?.output?.data schemea is invalid !',
            },
        });
    });
};

export default getITSMConnectorConfig;
