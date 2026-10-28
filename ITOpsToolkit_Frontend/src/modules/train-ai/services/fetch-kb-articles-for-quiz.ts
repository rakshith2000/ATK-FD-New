import { withApiResponseHandler } from '@/api/utils/with-api-response-handler-hof';
import { appConfig } from '@/config/app-config';
import backendApiClient from '@/api/axios-clients/backend-api/backend-api-client';
import { isNewQuizKbArticlesResponse } from '../type-guards/train-ai.guadrs';
import type { NewQuizKbArticlesResponse } from '../types/train-ai';

const fetchKbArticlesForQuiz = async () => {
    return withApiResponseHandler<NewQuizKbArticlesResponse>(async () => {
        const response = await backendApiClient.get(appConfig.backend.api.listKnowledgeArticles);

        if (response?.data?.output?.data && isNewQuizKbArticlesResponse(response?.data?.output?.data)) {
            return response.data.output.data;
        } else {
            throw new Error('Unable to fetch KB articles for quiz, failed to validate response JSON Schema !', {
                cause: {
                    reason: 'response?.data?.output?.data schema is invalid !',
                },
            });
        }
    });
};

export default fetchKbArticlesForQuiz;
