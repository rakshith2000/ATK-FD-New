import { Trophy, AlertTriangle } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal/Modal';
import TitleWithArraow from '@/shared/components/ui/TitleWithArraow/TitleWithArraow';

interface QuizCompletedModalProps {
    isOpen: boolean;
    score: string;
    remarks: string;
    onReviewAnswers: () => void;
    onClose: () => void;
}

const QuizCompletedModal: React.FC<QuizCompletedModalProps> = ({ isOpen, score, remarks, onReviewAnswers, onClose }) => {
    const isPassed = remarks.toLowerCase() !== 'fail';
    const parsedScore = parseFloat(score.replace('%', ''));
    const hasPerfectScore = !isNaN(parsedScore) && parsedScore === 100;

    return (
        <Modal open={isOpen} onClose={onClose} size="md" closeOnOutsideClick={false}>
            <Modal.Header className="mb-0 bg-(--brand-color) border-b-(--brand-color) text-(--brand-text-inverse) font-semibold text-sm 2xl:text-base">
                <TitleWithArraow title="QUIZ COMPLETED SUCCESSFULLY" className="text-sm font-extrabold uppercase text-(--brand-text-inverse) items-center" />
            </Modal.Header>

            <Modal.Body className="px-4 pt-2">
                <div className={`rounded border p-4 flex flex-col gap-3 ${isPassed ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                    <div className="flex items-center gap-2">
                        {isPassed ? <Trophy size={16} className="text-green-500 shrink-0" /> : <AlertTriangle size={16} className="text-orange-500 shrink-0" />}
                        <p className="text-sm font-bold text-(--brand-color)">Your Score is {score}</p>
                    </div>
                    <p className={`text-xs font-semibold ${isPassed ? 'text-green-600' : 'text-orange-600'}`}>
                        {isPassed ? 'Congratulations! You passed!' : 'Failed! Please try again'}
                    </p>
                </div>
            </Modal.Body>

            <Modal.Footer className="justify-center px-4 pb-3 pt-1 gap-2">
                {!hasPerfectScore && (
                    <Modal.ActionButton variant="secondary" onClick={onReviewAnswers} className=" w-[50%] max-w-40 ">
                        Review Incorrect Answers
                    </Modal.ActionButton>
                )}
                <Modal.ActionButton variant="primary" onClick={onClose} className="w-[50%] max-w-40 ">
                    OK
                </Modal.ActionButton>
            </Modal.Footer>
        </Modal>
    );
};

export default QuizCompletedModal;
