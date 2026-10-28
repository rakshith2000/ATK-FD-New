import React from 'react';
import { FaUsers, FaUser, FaUserTimes } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { TextInput } from '@/shared/components/ui/InputFields';
import { YearFilter } from '../../ui/YearFilter/YearFilter';

export interface FasteDashboardHeaderProps {
    activeTab: 'dashboard' | 'tickets';
    setActiveTab: React.Dispatch<React.SetStateAction<'dashboard' | 'tickets'>>;
    searchValue: string;
    onSearchChange: React.Dispatch<React.SetStateAction<string>>;
    assignmentFilter: 'assigned-to-user' | 'assignment-group' | 'unassigned';
    setAssignmentFilter: React.Dispatch<React.SetStateAction<'assigned-to-user' | 'assignment-group' | 'unassigned'>>;
    selectedYear: string;
    setSelectedYear: React.Dispatch<React.SetStateAction<string>>;
    filterOpen: boolean;
    setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onFilterChange?: (filterData: { mode: string; year: string; quarter: number | null; month: number | null; start: Date | null; end: Date | null }) => void;
}

export const FasteDashboardHeader: React.FC<FasteDashboardHeaderProps> = ({
    activeTab,
    setActiveTab,
    searchValue,
    onSearchChange,
    assignmentFilter,
    setAssignmentFilter,
    selectedYear,
    setSelectedYear,
    filterOpen,
    setFilterOpen,
    onFilterChange,
}) => {
    const yearsList = ['2024', '2025', '2026', '2027'];

    const renderThreeButtons = () => (
        <div className="flex items-center gap-2 flex-wrap">
            <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`cursor-pointer px-[20px] py-[8px] rounded-[8px] text-[14px] font-bold border transition-all duration-250 ease-in-out ${
                    activeTab === 'dashboard' ? 'bg-[#011A80] text-white border-[#011A80] shadow-sm' : 'bg-[#F0F7FF] text-[#3D54D0] border-[#BBDDFF] hover:bg-[#e4f0fd]'
                }`}
            >
                Analytics Dashboard
            </button>

            <button
                type="button"
                onClick={() => setActiveTab('tickets')}
                className={`cursor-pointer px-[20px] py-[8px] rounded-[8px] text-[14px] font-semibold border transition-all duration-250 ease-in-out ${
                    activeTab === 'tickets' ? 'bg-[#011A80] text-white border-[#011A80] shadow-sm' : 'bg-[#F0F7FF] text-[#3D54D0] border-[#BBDDFF] hover:bg-[#e4f0fd]'
                }`}
            >
                Active Tickets
            </button>

            <div className="rounded [&_button]:!bg-[#F0F7FF] [&_button]:!border-[#BBDDFF] [&_button]:!text-[#3D54D0] [&_button]:!px-[20px] [&_button]:!py-[8px] [&_button]:!rounded-[8px] [&_button]:!text-[14px] [&_button]:!font-semibold [&_button]:!cursor-pointer [&_button:hover]:!bg-[#e4f0fd] transition-all duration-250 ease-in-out">
                <YearFilter
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    filterOpen={filterOpen}
                    setFilterOpen={setFilterOpen}
                    yearsList={yearsList}
                    onFilterChange={onFilterChange}
                />
            </div>
        </div>
    );

    return (
        <div className={`w-full flex flex-col md:flex-row items-center gap-4 mb-4 ${activeTab === 'dashboard' ? 'justify-start' : 'justify-between'}`}>
            {activeTab === 'dashboard' && renderThreeButtons()}

            {activeTab === 'tickets' && (
                <>
                    <div className="flex flex-wrap items-center gap-4 flex-grow">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className="p-2 text-[#3D54D0] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Back to Dashboard"
                        >
                            <FiArrowLeft size={20} className="stroke-[2.5]" />
                        </button>
                        <h4 className="text-[#3D54D0] font-bold text-lg m-0 whitespace-nowrap">Active Tickets</h4>

                        <div className="w-full sm:w-[220px]">
                            <TextInput value={searchValue} onChange={onSearchChange} placeholder="Search Number" />
                        </div>

                        <div className="flex items-center gap-1 bg-slate-50 border border-gray-200 p-1 rounded-xl">
                            <button
                                onClick={() => setAssignmentFilter('assigned-to-user')}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                    assignmentFilter === 'assigned-to-user' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title="Assigned to me"
                            >
                                <FaUser size={14} />
                            </button>
                            <button
                                onClick={() => setAssignmentFilter('assignment-group')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    assignmentFilter === 'assignment-group' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title="Assignment Group"
                            >
                                <FaUsers size={18} />
                            </button>
                            <button
                                onClick={() => setAssignmentFilter('unassigned')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    assignmentFilter === 'unassigned' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title="Unassigned"
                            >
                                <FaUserTimes size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-shrink-0 ml-auto">{renderThreeButtons()}</div>
                </>
            )}
        </div>
    );
};

export default FasteDashboardHeader;
