import type { SnowTicketType } from '@/shared/modules/servicenow/types/ticket';

const ticketTypeOptions: Array<{ label: string; value: SnowTicketType }> = [
    {
        label: 'SC REQ',
        value: 'sc_request',
    },
];

export default ticketTypeOptions;
