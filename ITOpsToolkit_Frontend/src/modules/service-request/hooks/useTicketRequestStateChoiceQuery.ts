import { useQuery } from '@tanstack/react-query';
import { fetchTicketRequestStateChoicesByTicketType, type TicketRequestStateChoice } from '../services/fetch-ticket-request-state-choices-by-ticket-type';
import type { SnowTicketType } from '@/shared/modules/servicenow/types/ticket';

/**
 * Service-request-local hook for request-state choices.
 *
 * Mirrors the shared `useTicketStateChoiceQuery` (same shape/return), but uses a
 * distinct query key and the module-local fetch so it stays isolated from the
 * shared state-choice query and cache.
 */
export function useTicketRequestStateChoiceQuery(ticketType: SnowTicketType) {
    const queryKey = ['ticketRequestStateChoiceQuery', ticketType];
    const query = useQuery<Array<TicketRequestStateChoice>, Error, Array<{ label: string; value: string }>>({
        queryKey: queryKey,
        queryFn: fetchTicketRequestStateChoicesByTicketType.bind(null, { ticketType }),
        staleTime: 5 * 60 * 1000,
        select: (data) => data.map((c) => ({ label: c.label, value: c.value })),
    });

    return { ...query, queryKey };
}
