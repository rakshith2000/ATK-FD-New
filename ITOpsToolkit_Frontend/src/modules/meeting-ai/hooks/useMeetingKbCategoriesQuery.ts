import { useQuery } from '@tanstack/react-query';
import fetchMeetingKbCategories from '../services/fetch-meeting-kb-categories';
import type { ListKnowledgeBaseCategoriesResponse } from '../types/meeting-ai';

export function useMeetingKbCategoriesQuery() {
    const queryKey = ['meetingKbCategories'];
    const query = useQuery<ListKnowledgeBaseCategoriesResponse, Error>({
        queryKey: [...queryKey],
        queryFn: fetchMeetingKbCategories,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    return { ...query, queryKey };
}
