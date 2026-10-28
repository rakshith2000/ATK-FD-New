import serviceNowApiClient from '@/api/axios-clients/service-now-api/service-now-api-client';
import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';
import { getAuthProviderInstance } from '@/shared/modules/auth/utils/get-auth-provider-instance';
import type { SnowTicket, SnowTicketType } from '../types/ticket';
import { isSnowTicketArray } from '../type-guards/ticket.guards';

export const fetchSnowAssignedTicketsByUserSysId = async ({ ticketType }: { ticketType: SnowTicketType }): Promise<Array<SnowTicket>> => {
    return withApiResponseHandler<Array<SnowTicket>>(async () => {
        const { sys_id } = await getAuthProviderInstance().getUserSnowDetails();

        const response = await serviceNowApiClient.get(
            appConfig.serviceNow.api.ticketsAssignedByUserSysId.replaceAll(/<TICKET_TYPE_PLACEHOLDER>/g, ticketType).replaceAll(/<USER_SYS_ID_PLACEHOLDER>/g, sys_id),
        );

        if ('result' in response?.data && isSnowTicketArray(response.data['result'])) {
            const tickets = response.data['result'];
            return tickets;
        } else {
            throw new Error('Failed to get the user assgiend tickets from Service Now !', {
                cause: {
                    reason: 'response?.data?.result schema is invalid!',
                },
            });
        }
    });
};
