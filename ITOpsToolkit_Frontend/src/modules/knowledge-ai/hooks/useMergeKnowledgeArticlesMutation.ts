import { useMutation } from '@tanstack/react-query';
import mergeKnowledgeArticles from '../services/merge-knowledge-articles';
import globalAlertDialogEventBus from '@/shared/components/smart/GlobalAlertDialog/global-alert-dialog-event-bus';
import logger from '@/shared/utils/logger';
import getErrorTitle from '@/api/utils/get-error-title';

export function useMergeKnowledgeArticlesMutation() {
    return useMutation({
        mutationFn: mergeKnowledgeArticles,

        onError: (error) => {
            globalAlertDialogEventBus.emit('show-dialog', {
                title: getErrorTitle(error),
                note: error?.message,
                priority: 'normal',
                severity: 'error',
                buttonText: 'Dismiss',
            });
        },

        onSuccess: (data) => {
            logger.debug(data);
        },
    });
}
