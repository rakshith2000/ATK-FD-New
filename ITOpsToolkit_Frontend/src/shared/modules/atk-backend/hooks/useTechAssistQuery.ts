import { useQuery } from '@tanstack/react-query';
import listRelevantArticles, { type ListRelevantArticlesResponse } from '../services/list-relevant-articles';

interface UseTechAssistQueryParams {
    selectedTicketId: string | null;
    shortDescription: string;
    description: string;
    closeNotes: string;
    comments: string;
    enabled: boolean;
}

export function useTechAssistQuery({ selectedTicketId, shortDescription, description, closeNotes, comments, enabled }: UseTechAssistQueryParams) {
    const queryKey = ['techAssistContext', selectedTicketId];
    const query = useQuery<ListRelevantArticlesResponse, Error>({
        queryKey: queryKey,
        queryFn: listRelevantArticles.bind(null, {
            close_notes: closeNotes,
            comments,
            description,
            short_description: shortDescription,
        }),
        enabled: enabled && !!selectedTicketId,
        staleTime: 5 * 60 * 1000,
    });

    return { ...query, queryKey };
}
