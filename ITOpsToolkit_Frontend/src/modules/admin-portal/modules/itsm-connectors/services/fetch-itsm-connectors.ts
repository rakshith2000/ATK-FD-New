import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { isITSMConnectorsListResponse } from '../type-guards/istm-connectors.guards';
import type { ITSMConnectorsListResponse } from '../types/itsm-connectors';

const fetchITSMConnectors = async () => {
    return withApiResponseHandler<ITSMConnectorsListResponse>(async () => {
        const response = await backendApiClient.get(appConfig.backend.api.listITSMConnectors);

        if (response?.data?.output?.data && isITSMConnectorsListResponse(response?.data?.output?.data)) {
            return response.data.output.data;
        } else {
            throw new Error('Unable to fetch the ITSM Connectors from API response, failed to validate response JSON Schema !', {
                cause: {
                    reason: 'response?.data?.output?.data schemea is invalid !',
                },
            });
        }
    });
};

export default fetchITSMConnectors;
