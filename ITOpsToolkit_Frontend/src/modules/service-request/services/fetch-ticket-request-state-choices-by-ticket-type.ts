import serviceNowApiClient from '@/api/axios-clients/service-now-api/service-now-api-client';
import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';
import type { SnowTicketType } from '@/shared/modules/servicenow/types/ticket';

export interface TicketRequestStateChoice {
    sys_id: string;
    label: string;
    value: string;
}

/**
 * Service-request-local state choice fetch.
 *
 * Mirrors the shared `fetchSnowTicketStateChoicesByTikcetType`, but targets the
 * `ticketRequestStateChoiceByTicketType` endpoint (sys_choice `element=request_state`)
 * so Service Request reads the request lifecycle labels instead of the generic
 * task `state` choices. Kept inside the module so shared behaviour is untouched.
 */
export const fetchTicketRequestStateChoicesByTicketType = async ({ ticketType }: { ticketType: SnowTicketType }): Promise<Array<TicketRequestStateChoice>> => {
    return withApiResponseHandler<Array<TicketRequestStateChoice>>(async () => {
        const response = await serviceNowApiClient.get(appConfig.serviceNow.api.ticketRequestStateChoiceByTicketType.replaceAll(/<TICKET_TYPE_PLACEHOLDER>/g, ticketType));

        if ('result' in response?.data && Array.isArray(response?.data?.['result'])) {
            const choices = response?.data.result;
            return choices;
        } else {
            throw new Error(`Unable to fetch request state choices from Service Now for ticket type ${ticketType} !`, {
                cause: {
                    reason: 'response?.data?.result schema is invalid!',
                },
            });
        }
    });
};
