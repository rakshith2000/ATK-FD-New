import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';

export interface ListRelevantArticlesResponse {
    articles_found: boolean;
    kb_numbers: Array<string>;
    knowledge_article_info: string;
    explanation: string;
}

export interface ListRelevantArticlesRequest {
    short_description: string;
    description: string;
    close_notes: string;
    comments: string;
}

export function isListRelevantArticlesResponse(value: unknown): value is ListRelevantArticlesResponse {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.articles_found === 'boolean' &&
        Array.isArray(v.kb_numbers) &&
        v.kb_numbers.every((item) => typeof item === 'string') &&
        typeof v.knowledge_article_info === 'string' &&
        typeof v.explanation === 'string'
    );
}

export function listRelevantArticlesResponseToMarkdown(data?: ListRelevantArticlesResponse): string {
    if (!data) return '';

    const lines: string[] = [];

    lines.push(`**Articles Found:** ${data.articles_found ? 'Yes' : 'No'}`);

    if (data.kb_numbers.length > 0) {
        lines.push(`\n**KB Numbers:**`);
        data.kb_numbers.forEach((kb) => lines.push(`- ${kb}`));
    }

    if (data.knowledge_article_info) {
        lines.push(`\n**Knowledge Article Info:**\n${data.knowledge_article_info}`);
    }

    if (data.explanation) {
        lines.push(`\n**Explanation:**\n${data.explanation}`);
    }

    return lines.join('\n');
}

const listRelevantArticles = async (payload: ListRelevantArticlesRequest): Promise<ListRelevantArticlesResponse> => {
    return withApiResponseHandler<ListRelevantArticlesResponse>(async () => {
        const response = await backendApiClient.post(appConfig.backend.api.listRelevantArticles, {
            ...payload,
        });

        if (response?.data?.output?.data && isListRelevantArticlesResponse(response?.data?.output?.data)) {
            return response?.data?.output?.data;
        } else {
            throw new Error('Unable to get the relevant articles response from API !, response?.data?.output?.data schemea is invalid !');
        }
    });
};

export default listRelevantArticles;
