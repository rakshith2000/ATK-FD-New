import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { twMerge, type ClassNameValue } from 'tailwind-merge';
import { isFlagTrue } from '../../../typeguard/fasteai-type-guards';
import { VirtualTable, type VirtualTableColumnDef } from '@/shared/modules/virtual-table';
import { SelectInput, type SelectOption } from '@/shared/components/ui/InputFields';
import { openSnowTicket } from '../../../utils/snowTicketHelper';

export interface Ticket {
    number: string;
    dashboard_category?: string;
    ticket_category?: string;
    short_description?: string;
    resolved: boolean | string;
    escalation_state: boolean | string;
}

interface TicketTableProps {
    filteredTickets: Ticket[];
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    isLoading?: boolean;
}

interface TitleWithArraowProps {
    title: string;
    className?: ClassNameValue;
    showArrow?: boolean;
}

const TitleWithArraow: React.FC<TitleWithArraowProps> = ({ title, className, showArrow = true }) => {
    return (
        <div className={twMerge('text-xs text-[var(--ticket-title-color)] font-bold inline-flex flex-col', className)}>
            <span>{title}</span>
            <div className="relative w-full">
                <hr className="m-0 border border-[var(--change-arrow-color-itsm)] opacity-100" />
                {showArrow ? (
                    <div
                        className="absolute right-0 top-px w-0 h-0"
                        style={{
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '6px solid var(--change-arrow-color-itsm)',
                        }}
                    />
                ) : null}
            </div>
        </div>
    );
};

export const TicketTable: React.FC<TicketTableProps> = ({ filteredTickets, filterStatus, setFilterStatus, isLoading = false }) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

    const statusOptions: SelectOption[] = useMemo(
        () => [
            { label: 'All Status', value: 'all' },
            { label: 'Resolved', value: 'resolved' },
            { label: 'Active', value: 'active' },
            { label: 'Escalated', value: 'escalated' },
        ],
        [],
    );

    // Reset pagination back to page 1 whenever filterStatus or the source dataset changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, filteredTickets]);

    const statusFilteredData = useMemo(() => {
        if (filterStatus === 'all') return filteredTickets;
        return filteredTickets.filter((ticket) => {
            const isResolved = isFlagTrue(ticket.resolved);
            const isEscalated = isFlagTrue(ticket.escalation_state);

            if (filterStatus === 'resolved') return isResolved;
            if (filterStatus === 'active') return !isResolved;
            if (filterStatus === 'escalated') return isEscalated;
            return true;
        });
    }, [filteredTickets, filterStatus]);

    const totalTickets = statusFilteredData.length;
    const totalPages = Math.ceil(totalTickets / itemsPerPage);

    // Safety check: reset to page 1 if current page exceeds newly calculated totalPages
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    // Paginate statusFilteredData for the table view
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return statusFilteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [statusFilteredData, currentPage, itemsPerPage]);

    const columns = useMemo<VirtualTableColumnDef<Ticket>[]>(
        () => [
            {
                id: 'number',
                accessorKey: 'number',
                header: 'Number',
                size: 120,
                minSize: 90,
                maxSize: 150,
                cell: ({ getValue }) => {
                    const ticketNumber = getValue<string>();
                    return (
                        <button
                            type="button"
                            onClick={() => {
                                openSnowTicket(ticketNumber);
                            }}
                            title="Open in ServiceNow"
                            style={{ color: 'rgb(29, 111, 219)' }}
                            className="font-bold underline cursor-pointer truncate block w-full text-center text-xs transition-colors bg-transparent border-0 p-0"
                        >
                            {ticketNumber}
                        </button>
                    );
                },
            },
            {
                id: 'dashboard_category',
                accessorKey: 'dashboard_category',
                header: 'Tower',
                size: 120,
                minSize: 90,
                maxSize: 150,
                cell: ({ getValue }) => <span className="text-gray-600 truncate block text-center text-xs">{getValue<string>() || 'Total Tickets'}</span>,
            },
            {
                id: 'ticket_category',
                accessorKey: 'ticket_category',
                header: 'Category',
                size: 140,
                minSize: 110,
                maxSize: 170,
                cell: ({ getValue }) => <span className="truncate max-w-[140px] block text-center text-xs">{getValue<string>() || 'General'}</span>,
            },
            {
                id: 'short_description',
                accessorKey: 'short_description',
                header: 'Description',
                size: 260,
                minSize: 180,
                cell: ({ getValue }) => (
                    <span className="text-left truncate block font-normal text-gray-500 text-xs" title={getValue<string>()}>
                        {getValue<string>()}
                    </span>
                ),
            },
            {
                id: 'resolved',
                accessorKey: 'resolved',
                header: 'Status',
                size: 90,
                minSize: 75,
                maxSize: 110,
                cell: ({ getValue }) => {
                    const resolved = isFlagTrue(getValue<boolean | string>());
                    return <span className={`font-bold text-xs ${resolved ? 'text-green-600' : 'text-[#3B62CC]'}`}>{resolved ? 'Resolved' : 'Active'}</span>;
                },
            },
            {
                id: 'escalation_state',
                accessorKey: 'escalation_state',
                header: 'Escalation',
                size: 90,
                minSize: 75,
                maxSize: 110,
                cell: ({ getValue }) => <span className="font-normal text-xs">{isFlagTrue(getValue<boolean | string>()) ? 'Yes' : 'No'}</span>,
            },
        ],
        [],
    );

    const startIndexText = totalTickets > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endIndexText = Math.min(currentPage * itemsPerPage, totalTickets);

    return (
        <div className="w-full flex flex-col mb-5">
            <div className="bg-white rounded-xl border border-blue-200 overflow-hidden shadow-xs p-0 flex flex-col">
                <div className="h-[420px] w-full">
                    <VirtualTable
                        data={paginatedData}
                        columns={columns}
                        getRowId={(row, index) => `${row.number}-${index}`}
                        enableSorting={true}
                        enableColumnFilters={false}
                        enableGlobalFilter={true}
                        isLoading={isLoading}
                        emptyTitle="No records found"
                        emptyMessage="Try adjusting filters and check !"
                        classNames={{
                            tbodyCell: 'text-xs py-2 text-center border-b border-gray-200 text-gray-600',
                            theadCell: 'text-xs font-semibold py-2 bg-[#C1E1FF] text-[#0A369D] text-center border-r border-blue-200',
                            toolbar: 'py-2 px-3 flex items-center justify-between gap-3 border-b border-blue-100',
                            theadRow: 'bg-[#C1E1FF]',
                            thead: 'bg-[#C1E1FF]',
                        }}
                    >
                        <VirtualTable.Toolbar>
                            <TitleWithArraow
                                title="Ticket Details"
                                showArrow={true}
                                className="p-0 text-base font-bold pb-0.5 tracking-tight text-[#0A369D] [--ticket-title-color:#0A369D] [--change-arrow-color-itsm:#0A369D]"
                            />
                            <div className="flex-1" />
                            <div className="flex items-center gap-2">
                                <VirtualTable.GlobalSearch placeholder="Search Number..." />
                                <div className="w-36">
                                    <SelectInput
                                        options={statusOptions}
                                        value={filterStatus}
                                        clearable={false}
                                        onChange={(val) => {
                                            setFilterStatus(val as string);
                                            setCurrentPage(1);
                                        }}
                                        triggerClassName="rounded-lg py-1 px-2.5 shadow-xs bg-white h-[32px] text-xs text-gray-700 border-gray-300"
                                    />
                                </div>
                                <VirtualTable.ColumnConfig />
                            </div>
                        </VirtualTable.Toolbar>
                        <VirtualTable.Content className="rounded-none" />
                    </VirtualTable>
                </div>

                {/* Legacy-matching External Pagination Bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-slate-50/60 border-t border-blue-100 text-sm font-medium text-slate-700 select-none">
                    <div className="text-sm font-medium text-slate-600">Rows Per Page: 10</div>
                    <div className="flex items-center gap-6">
                        <span className="text-sm font-medium text-slate-700">
                            {startIndexText}-{endIndexText} Of {totalTickets}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                className="p-1 rounded-md text-slate-600 hover:bg-slate-200/60 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors bg-transparent border-0 cursor-pointer"
                                title="Previous Page"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-700" />
                            </button>
                            <button
                                type="button"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                className="p-1 rounded-md text-slate-600 hover:bg-slate-200/60 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors bg-transparent border-0 cursor-pointer"
                                title="Next Page"
                            >
                                <ChevronRight className="w-5 h-5 text-slate-700" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketTable;
