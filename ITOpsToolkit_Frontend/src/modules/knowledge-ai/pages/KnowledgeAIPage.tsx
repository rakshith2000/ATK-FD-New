import { useKnowledgeArticlesQuery } from '../hooks/useKnowledgeArticlesQuery';
import { useDuplicateKnowledgeArticlesQuery } from '../hooks/useDuplicateKnowledgeArticlesQuery';
import KnowledgeBaseOverview from '../components/smart/KnowledgeBaseOverview/KnowledgeBaseOverview';
import DuplicateArticles from '../components/smart/DuplicateArticles/DuplicateArticles';
import LowScoringArticles from '../components/smart/LowScoringArticles/LowScoringArticles';
import ShellLayout from '@/shared/components/ui/ShellLayout/ShellLayout';
import IssuesWithoutKBArticleTable from '../components/smart/IssuesWithoutKBArticleTable/IssuesWithoutKBArticleTable';
import RecentKBArticlesList from '../components/smart/RecentKBArticlesList/RecentKBArticlesList';
import { useState } from 'react';
import RefineLowScoringArticleModal from '../components/smart/RefineArticleModal/RefineArticleModal';
import TitleWithArraow from '@/shared/components/ui/TitleWithArraow/TitleWithArraow';
import { twMerge } from 'tailwind-merge';
import MergeDuplicateKBArticlesModal from '../components/smart/MergeDuplicateKBArticlesModal/MergeDuplicateKBArticlesModal';
import useKnowledgeArticlesWhereUserCanAccessQuery from '@/shared/modules/servicenow/hooks/useKnowledgeArticlesWhereUserCanAccessQuery';

const KnowledgeAIPage: React.FC = () => {
    const knowledgeArticlesQuery = useKnowledgeArticlesQuery();
    const duplicateKnowledgeArticlesQuery = useDuplicateKnowledgeArticlesQuery();
    const knowledgeArticlesWhereUserCanAccessQuery = useKnowledgeArticlesWhereUserCanAccessQuery({ getOnlyRecentKbs: false });

    const [showLowScoringArticlesModal, setShowLowScoringArticlesNModal] = useState(false);
    const [showMergeDuplicateArticlesModal, setShowMergeDuplicateArticlesNModal] = useState(false);

    return (
        <div id="knowledge-ai" className="grid w-full h-full gap-1 p-0 overflow-auto lg:overflow-x-hidden" style={{ gridTemplateRows: 'auto 1fr' }}>
            <div className="grid grid-cols-1 gap-0.5 mt-0.5 px-1">
                {/* KB Overview Cards */}
                <KnowledgeBaseOverview className="min-h-30 gap-0 p-0" knowledgeArticlesQuery={knowledgeArticlesWhereUserCanAccessQuery} />

                {/* KB Quality Analytics */}
                <ShellLayout className="min-h-30 w-full shadow-xs rounded border-none gap-0">
                    <ShellLayout.Header className="flex justify-between items-center h-5 text-sm text-(--brand-header-title-color) font-bold">
                        <TitleWithArraow className="uppercase text-xs font-extrabold" title="Knowledge Base Quality Analytics"></TitleWithArraow>
                    </ShellLayout.Header>
                    <ShellLayout.Body className={twMerge('overflow-x-auto overflow-y-auto px-1 py-0')}>
                        <div className="flex flex-row gap-4 justify-center items-center h-full">
                            <DuplicateArticles duplicateKnowledgeArticlesQuery={duplicateKnowledgeArticlesQuery} onClick={() => setShowMergeDuplicateArticlesNModal(true)} />
                            <LowScoringArticles knowledgeArticlesQuery={knowledgeArticlesQuery} onClick={() => setShowLowScoringArticlesNModal(true)} />
                        </div>
                    </ShellLayout.Body>
                </ShellLayout>
            </div>

            {/* Row 2 -> Tickets without KB's & Recently Generated KB's */}
            <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-1 min-h-150 lg:min-h-0">
                {/* Tickets without KB's Table */}
                <ShellLayout className="min-h-40 w-full shadow-none border-none py-0">
                    <ShellLayout.Body className="overflow-auto pl-1 py-1">
                        <IssuesWithoutKBArticleTable />
                    </ShellLayout.Body>
                </ShellLayout>

                {/* Recently Generated KB's List */}
                <ShellLayout className="min-h-50 lg:min-h-0 w-full shadow-none rounded-none border-none px-1">
                    <ShellLayout.Body className="overflow-hidden px-0 py-0 my-1 rounded-md shadow">
                        <RecentKBArticlesList />
                    </ShellLayout.Body>
                </ShellLayout>
            </div>

            {/* Low Scoring Articles Modal */}
            <RefineLowScoringArticleModal isOpen={showLowScoringArticlesModal} onClose={() => setShowLowScoringArticlesNModal(false)} query={knowledgeArticlesQuery} />

            {/* Duplicate Articles Modal */}
            <MergeDuplicateKBArticlesModal
                isOpen={showMergeDuplicateArticlesModal}
                onClose={() => setShowMergeDuplicateArticlesNModal(false)}
                query={duplicateKnowledgeArticlesQuery}
            />
        </div>
    );
};

export default KnowledgeAIPage;
