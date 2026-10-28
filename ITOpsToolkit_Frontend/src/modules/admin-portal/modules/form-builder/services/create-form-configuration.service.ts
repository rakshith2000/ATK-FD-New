import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { appConfig } from '@/config/app-config';
import type { FormConfigRecord } from '../types/form-config';

function createFormConfigurationService({ form_name, form_config }: { form_name: string; form_config: FormConfigRecord }) {
    return withApiResponseHandler<string>(async () => {
        const response = await backendApiClient.post(appConfig.backend.api.create_form_configuration, {
            name: form_name,
            form: { ...form_config },
        });

        return response?.data?.output?.message || 'No Message Recived from API';
    });
}

export default createFormConfigurationService;
