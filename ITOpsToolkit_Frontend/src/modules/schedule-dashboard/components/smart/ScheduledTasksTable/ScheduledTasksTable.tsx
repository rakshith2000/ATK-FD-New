import React, { useMemo, useState, useEffect } from 'react';
import { LayoutGrid, Terminal, Database, Network, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { VirtualTable, type VirtualTableColumnDef } from '@/shared/modules/virtual-table';
import TitleWithArraow from '@/shared/components/ui/TitleWithArraow/TitleWithArraow';
import { SelectInput, type SelectOption } from '@/shared/components/ui/InputFields';
import type { ScheduleTask } from '../../../types/types';

const towerIcons: Record<string, React.ReactNode> = {
    windows: <LayoutGrid className="w-3.5 h-3.5 text-blue-900" />,
    linux: <Terminal className="w-3.5 h-3.5 text-blue-900" />,
    database: <Database className="w-3.5 h-3.5 text-blue-900" />,
    network: <Network className="w-3.5 h-3.5 text-blue-900" />,
};

const statusColors: Record<string, string> = {
    Completed: 'text-green-600 font-bold',
    Failed: 'text-red-600 font-bold',
    Awaiting: 'text-amber-600 font-bold',
    Scheduled: 'text-blue-600 font-bold',
    Triggered: 'text-purple-600 font-bold',
};

interface ScheduledTasksTableProps {
    tasks: ScheduleTask[];
    isLoading: boolean;
    isRefetching: boolean;
    error: unknown;
    refetch: () => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    statusOptions: SelectOption[];
    onRowClick: (task: ScheduleTask) => void;
    onViewReport: (task: ScheduleTask) => void;
    onDownloadLogs: (task: ScheduleTask) => void;
}

export const ScheduledTasksTable: React.FC<ScheduledTasksTableProps> = ({
    tasks,
    isLoading,
    isRefetching,
    error,
    refetch,
    selectedStatus,
    setSelectedStatus,
    statusOptions,
    onRowClick,
    onViewReport,
    onDownloadLogs,
}) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

    // Reset pagination to page 1 whenever the input tasks list or status filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStatus, tasks]);

    const totalTasks = tasks.length;
    const totalPages = Math.ceil(totalTasks / itemsPerPage);

    // Safety check: reset to page 1 if current page exceeds newly calculated totalPages
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    // Paginate data for virtual table display
    const paginatedTasks = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return tasks.slice(startIndex, startIndex + itemsPerPage);
    }, [tasks, currentPage, itemsPerPage]);

    const columns = useMemo<VirtualTableColumnDef<ScheduleTask>[]>(
        () => [
            {
                id: 'taskName',
                accessorKey: 'taskName',
                header: 'Task Name',
                size: 170,
                minSize: 130,
                maxSize: 210,
                cell: ({ getValue }) => (
                    <span className="font-bold text-slate-800 truncate block text-center text-xs" title={getValue<string>()}>
                        {getValue<string>()}
                    </span>
                ),
            },
            {
                id: 'tower',
                accessorKey: 'tower',
                header: 'Tower',
                size: 90,
                minSize: 75,
                maxSize: 110,
                cell: ({ getValue }) => {
                    const val = getValue<string>() || '';
                    return (
                        <div className="flex items-center justify-center space-x-1 text-xs">
                            {towerIcons[val.toLowerCase()]}
                            <span>{val}</span>
                        </div>
                    );
                },
            },
            {
                id: 'sop',
                accessorKey: 'sop',
                header: 'SOP Target Workflow',
                size: 190,
                minSize: 150,
                maxSize: 230,
                cell: ({ getValue }) => (
                    <span className="font-mono text-slate-500 truncate block text-center text-xs" title={getValue<string>()}>
                        {getValue<string>()}
                    </span>
                ),
            },
            {
                id: 'reportType',
                accessorKey: 'reportType',
                header: 'Report Type',
                size: 100,
                minSize: 85,
                maxSize: 120,
                cell: ({ getValue }) => <span className="capitalize text-xs">{getValue<string>()}</span>,
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: 'Status',
                size: 95,
                minSize: 75,
                maxSize: 115,
                cell: ({ getValue }) => {
                    const status = getValue<string>();
                    return <span className={`text-xs ${statusColors[status] || 'text-slate-500'}`}>{status}</span>;
                },
            },
            {
                id: 'ticketRequired',
                accessorKey: 'ticketRequired',
                header: 'Ticket',
                size: 75,
                minSize: 55,
                maxSize: 85,
                cell: ({ getValue }) => <span className="text-xs">{getValue<boolean>() ? 'Yes' : 'No'}</span>,
            },
            {
                id: 'ciItems',
                accessorKey: 'ciItems',
                header: 'CI Items',
                size: 85,
                minSize: 65,
                maxSize: 100,
                cell: ({ getValue }) => {
                    const items = getValue<unknown[]>() || [];
                    return (
                        <span
                            className="text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[48px]"
                            style={{ backgroundColor: 'var(--brand-title-primary-color)' }}
                        >
                            {items.length} CI{items.length !== 1 ? 's' : ''}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: 'Actions',
                size: 85,
                minSize: 75,
                maxSize: 100,
                cell: ({ row }) => {
                    const task = row.original;
                    return (
                        <div className="flex items-center justify-center space-x-1.5">
                            {task.status === 'Completed' && task.reportType?.toLowerCase() === 'self download' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewReport(task);
                                    }}
                                    className="text-white font-bold text-[10px] px-2 py-0.5 rounded active:scale-95 transition-all shadow-xs"
                                    style={{
                                        backgroundColor: 'var(--brand-title-primary-color)',
                                    }}
                                >
                                    View
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDownloadLogs(task);
                                }}
                                className="text-emerald-600 hover:text-emerald-700 p-0.5 flex items-center justify-center transition-colors active:scale-90"
                                title="Download Logs File"
                            >
                                <Download size={13} className="stroke-[2.5]" />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [onViewReport, onDownloadLogs],
    );

    const startIndexText = totalTasks > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endIndexText = Math.min(currentPage * itemsPerPage, totalTasks);

    return (
        <div className="bg-white rounded-xl border overflow-hidden shadow-xs p-0 flex flex-col mb-5" style={{ borderColor: '#b9d5ff' }}>
            <div className="h-[420px] w-full">
                <VirtualTable
                    data={paginatedTasks}
                    columns={columns}
                    getRowId={(row) => row._id}
                    onRowClick={onRowClick}
                    enableSorting={true}
                    enableColumnFilters={false}
                    enableGlobalFilter={true}
                    isLoading={isLoading}
                    error={error ? (error as Error) : null}
                    onRetry={refetch}
                    isRetrying={isRefetching}
                    retryLabel="Reload"
                    emptyTitle="No tasks found"
                    emptyMessage="Try adjusting filters and check !"
                    classNames={{
                        tbodyCell: 'text-xs py-1.5 text-center border-b border-blue-100',
                        theadCell: 'text-xs font-bold py-2 bg-[#bfdbfe] text-center border-r border-[#93c5fd]/60',
                        toolbar: 'py-2 px-3 flex items-center justify-between border-b border-blue-100',
                        theadRow: 'bg-[#bfdbfe]',
                        thead: 'bg-[#bfdbfe]',
                    }}
                >
                    <VirtualTable.Toolbar>
                        <TitleWithArraow
                            className="text-base font-extrabold pb-0.5 tracking-wide text-[var(--brand-title-primary-color)] p-0"
                            title="Scheduled Tasks"
                            showArrow={true}
                        />
                        <div className="flex-1" />
                        <div className="flex items-center space-x-2">
                            <VirtualTable.GlobalSearch placeholder="Search tasks..." />
                            <div className="w-36">
                                <SelectInput
                                    options={statusOptions}
                                    value={selectedStatus}
                                    clearable={false}
                                    onChange={(v) => {
                                        setSelectedStatus(v as string);
                                        setCurrentPage(1);
                                    }}
                                    triggerClassName="rounded-lg py-1 px-2.5 shadow-xs bg-white h-[32px] text-xs font-bold border-slate-200"
                                    style={{ color: 'var(--brand-title-primary-color)' }}
                                />
                            </div>
                            <VirtualTable.ColumnConfig />
                        </div>
                    </VirtualTable.Toolbar>
                    <VirtualTable.Content className="rounded-none" />
                </VirtualTable>
            </div>

            {/* Custom Pagination Bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-50/60 border-t border-blue-100 text-sm font-medium text-slate-700 select-none">
                <div className="text-sm font-medium text-slate-600">Rows Per Page: 10</div>
                <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-slate-700">
                        {startIndexText}-{endIndexText} Of {totalTasks}
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
    );
};

export default ScheduledTasksTable;
