import { useMutation } from '@tanstack/react-query';
import generateQuiz from '../services/generate-quiz';
import globalAlertDialogEventBus from '@/shared/components/smart/GlobalAlertDialog/global-alert-dialog-event-bus';
import getErrorTitle from '@/api/utils/get-error-title';

export const useGenerateQuizMutation = () => {
    return useMutation({
        mutationFn: (articlesNumber: string[]) => generateQuiz(articlesNumber),
        onError: (error) => {
            globalAlertDialogEventBus.emit('show-dialog', {
                title: getErrorTitle(error),
                note: error?.message,
                priority: 'normal',
                severity: 'error',
                buttonText: 'Dismiss',
            });
        },
    });
};
