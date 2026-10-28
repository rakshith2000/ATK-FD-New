import { AlertTriangle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import Modal from '@/shared/components/ui/Modal/Modal';
import TitleWithArraow from '@/shared/components/ui/TitleWithArraow/TitleWithArraow';
import CopyText from '@/shared/components/ui/CopyText/CopyText';

interface GenerateQuizSuccessModalProps {
    isOpen: boolean;
    quizId: string;
    passingThreshold: number;
    onClose: () => void;
    onStartQuiz: () => void;
}

const GenerateQuizSuccessModal: React.FC<GenerateQuizSuccessModalProps> = ({ isOpen, quizId, passingThreshold, onClose, onStartQuiz }) => {
    const navigate = useNavigate();

    const handleOk = () => {
        onClose();
        navigate({ to: '/transition-ai/train-ai/train-history' });
    };

    return (
        <Modal open={isOpen} onClose={onClose} size="md" closeOnOutsideClick={false}>
            <Modal.Header className=" mb-0 bg-(--brand-color) border-b-(--brand-color) text-(--brand-text-inverse) font-semibold text-sm 2xl:text-base">
                <TitleWithArraow title="QUIZ SUCCESSFULLY GENERATED" className="text-sm font-extrabold uppercase text-(--brand-text-inverse) items-center" />
            </Modal.Header>

            <Modal.Body className="px-4 pt-2  overflow-visible">
                <div className="rounded border border-blue-200 bg-blue-50 p-4 flex flex-col gap-3 overflow-visible">
                    <CopyText text={quizId}>{() => <span className="text-sm font-bold text-(--brand-color)">Quiz ID: {quizId}</span>}</CopyText>
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-700">You need to get at least {passingThreshold}% to pass the quiz.</p>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="justify-center gap-2 px-4 pb-3 pt-1">
                <Modal.ActionButton variant="secondary" onClick={handleOk} className=" w-[50%] max-w-40">
                    OK
                </Modal.ActionButton>
                <Modal.ActionButton variant="primary" onClick={onStartQuiz} className=" w-[50%] max-w-40">
                    Start Quiz
                </Modal.ActionButton>
            </Modal.Footer>
        </Modal>
    );
};

export default GenerateQuizSuccessModal;
