import { useQuery } from '@tanstack/react-query';
import { fetchSnowActiveTicketDetails, type ActiveTicketDetail } from '../services/fetch-snow-active-ticket-details';

/**
 * Fetches live ServiceNow incident details for the given active ticket numbers.
 * Returns a map keyed by upper-cased ticket number so callers can enrich the
 * locally-tracked active tickets with real details (priority, assigned_to, etc.).
 */
export const useActiveTicketDetails = (ticketNumbers: string[]): Record<string, ActiveTicketDetail> => {
    const normalizedNumbers = Array.from(new Set(ticketNumbers.map((num) => String(num).trim().toUpperCase()).filter((num) => num.length > 0))).sort();

    const { data } = useQuery<Record<string, ActiveTicketDetail>>({
        queryKey: ['faste-active-ticket-details', normalizedNumbers],
        queryFn: () => fetchSnowActiveTicketDetails(normalizedNumbers),
        enabled: normalizedNumbers.length > 0,
        refetchInterval: 30000,
        staleTime: 15000,
    });

    return data ?? {};
};
