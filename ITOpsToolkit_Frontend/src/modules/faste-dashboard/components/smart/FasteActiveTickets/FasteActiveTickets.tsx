import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, ExternalLink, Coins } from 'lucide-react';
import { fasteaiFetch, FASTEAI_CORE_BASE, FASTEAI_CORE_WS } from '../../../../../api/axios-clients/fasteai/fasteaiAuth';
import { useLiveTaskLogs } from '../../../hooks/useActiveticket';
import { FasteLogModal } from '../FasteLogModal/FasteLogModal';
import { reassignAutomationTicket } from '../../../services/patch-ticket';

export interface ExtendedTicket {
    id?: string | number;
    ticket_id?: string | number;
    number: string;
    created_on?: string;
    resolved?: boolean | string;
    escalation_state?: boolean | string;
    dashboard_category?: string;
    ticket_category?: string;
    escalation_category?: string[];
    short_description?: string;
    description?: string;
    assignment_group?: string;
    assigned_to?: string;
    cmdb_ci?: string;
    priority?: string | number;
    [key: string]: unknown;
}

interface LoginDetails {
    currentuserDetails?: {
        name?: string;
        display_name?: string;
        user_name?: string;
    };
}

interface FasteActiveTicketsProps {
    incidentData: ExtendedTicket[];
    loginUserSysId: string;
    loginDetails: LoginDetails;
}

export const FasteActiveTickets: React.FC<FasteActiveTicketsProps> = ({ incidentData, loginUserSysId, loginDetails }) => {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

    const { allReceivedLogs, progress, handledTime, tokensUsed, completedTickets, wsDisconnected } = useLiveTaskLogs(
        incidentData,
        fasteaiFetch,
        FASTEAI_CORE_BASE,
        FASTEAI_CORE_WS,
    );

    const reassignMutation = useMutation({
        mutationFn: async (incident: ExtendedTicket) => {
            const userInfo = loginDetails?.currentuserDetails ?? {};
            const userName = userInfo.name ?? userInfo.display_name ?? userInfo.user_name ?? loginUserSysId;
            const timestamp = new Date().toLocaleString();

            const workNote =
                `FasteAI automation task stopped and ticket reassigned.\n` +
                `Action taken by: ${userName}\n` +
                `Timestamp: ${timestamp}\n` +
                `Note: Automated task was terminated by the user and ticket has been reassigned to ${userName} for manual handling.`;

            const targetId = String(incident.id ?? incident.ticket_id ?? incident.number);

            return reassignAutomationTicket(targetId, incident.number, {
                assignedTo: loginUserSysId,
                workNotes: workNote,
                shortDescription: incident.short_description ?? '',
                description: incident.description ?? '',
            });
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['fasteai-logs'] });
        },
    });

    const activeIncidents = useMemo(() => {
        return incidentData.filter((inc) => !completedTickets.has(inc.number));
    }, [incidentData, completedTickets]);

    const getIncidentLogs = (id: string) => allReceivedLogs[id] ?? [];

    const getCurrentStatus = (incidentNumber: string) => {
        const logs = getIncidentLogs(incidentNumber);
        if (logs.length === 0) return 'Waiting for agent assignment...';
        const latestLog = logs[logs.length - 1];
        if (latestLog.message?.includes('TERMINATE') || latestLog.message?.includes('completed')) {
            return 'Task completed successfully';
        }
        if (latestLog.message?.includes('failed') || latestLog.message?.includes('error')) {
            return 'Task failed - investigating';
        }
        if (latestLog.message?.includes('Step') && latestLog.message?.includes(':')) {
            const stepMatch = latestLog.message.match(/Step \d+[^:]*:?\s*(.+)/);
            if (stepMatch) return `Executing: ${stepMatch[1].substring(0, 45)}...`;
        }
        return `${latestLog.message?.substring(0, 50) ?? 'Processing'}...`;
    };

    const downloadLogs = (incidentId: string) => {
        const logs = getIncidentLogs(incidentId);
        const logText = logs.map((l) => `[${l.source ?? 'Agent'}] ${l.message ?? ''}`).join('\n\n');
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${incidentId}_operation_logs.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderValue = (val: unknown): string => {
        if (val === null || val === undefined) return 'NA';
        if (typeof val === 'object') {
            const record = val as Record<string, unknown>;
            if (typeof record.display_value === 'string' && record.display_value.trim()) return record.display_value;
            if (typeof record.value === 'string' && record.value.trim()) return record.value;
            return 'NA';
        }
        const text = String(val).trim();
        return text === '' ? 'NA' : text;
    };

    if (activeIncidents.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center text-center py-10 bg-white border border-slate-100 rounded-xl shadow-sm">
                <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                <h6 className="text-[#011A80] font-black text-base">All Tasks Executed Successfully</h6>
                <p className="text-slate-400 text-xs mt-1">No pending live automation requests active.</p>
            </div>
        );
    }

    return (
        <div className="w-full p-1">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {activeIncidents.map((incident) => {
                    const incidentId = incident.number;
                    const currentStatus = getCurrentStatus(incidentId);
                    const incidentProgress = progress[incidentId] ?? 0;

                    const isCompleted = incidentProgress >= 100;
                    const isMutating = reassignMutation.isPending && reassignMutation.variables?.number === incidentId;
                    const isSuccess = reassignMutation.isSuccess && reassignMutation.variables?.number === incidentId;
                    const isError = reassignMutation.isError && reassignMutation.variables?.number === incidentId;

                    return (
                        <div
                            key={incidentId}
                            className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm transition-all hover:shadow-md cursor-pointer overflow-hidden [box-shadow:inset_0_2px_8px_0_#abc2ff]"
                            onClick={() => {
                                setSelectedIncidentId(incidentId);
                                setShowModal(true);
                            }}
                        >
                            <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 flex-1">
                                <div className="md:col-span-7 flex flex-col gap-1 text-[11px]">
                                    <div className="flex items-center">
                                        <span className="w-1/3 font-semibold text-slate-500">Incident Number</span>
                                        <span className="w-2/3 text-[#011A80] font-black text-xs">{renderValue(incident.number)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-1/3 font-semibold text-slate-500">Priority</span>
                                        <span className="w-2/3 text-slate-700 font-semibold">{renderValue(incident.priority)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-1/3 font-semibold text-slate-500">Assigned To</span>
                                        <span className="w-2/3 text-slate-700 truncate">{renderValue(incident.assigned_to)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-1/3 font-semibold text-slate-500">Assignment Group</span>
                                        <span className="w-2/3 text-slate-700 truncate">{renderValue(incident.assignment_group)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-1/3 font-semibold text-slate-500">Config Item</span>
                                        <span className="w-2/3 text-slate-700 truncate">{renderValue(incident.cmdb_ci)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-1/3 font-semibold text-slate-500">Short Description</span>
                                        <span className="w-2/3 text-slate-600 truncate font-normal">{renderValue(incident.short_description)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-1/3 font-semibold text-slate-500">Description</span>
                                        <span className="w-2/3 text-slate-600 truncate font-normal">{renderValue(incident.description)}</span>
                                    </div>
                                </div>

                                <div className="md:col-span-5 md:border-l md:border-slate-100 md:pl-3 flex flex-col justify-between">
                                    <div>
                                        <div className="mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Current Status</span>
                                            <span className="text-xs font-black text-slate-800">
                                                {renderValue(incident.resolved === 'true' || incident.resolved === true ? 'Resolved' : 'Work in Progress')}
                                            </span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Steps Under Progress</span>
                                            <p className="text-[11px] text-slate-600 m-0 leading-tight font-medium line-clamp-2">{currentStatus}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                        <div className="truncate pr-1">
                                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Assignee Target</span>
                                            <span className="text-[11px] font-bold text-slate-700 truncate block">{renderValue(incident.assigned_to)}</span>
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-[#011A80] flex-shrink-0" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#E3F2FD] border-t border-blue-100 p-2.5 mt-auto">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="w-full sm:w-1/2 bg-blue-200/50 h-4 rounded-full relative overflow-hidden flex items-center shadow-inner">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-[#011A80] h-full transition-all duration-300 rounded-full"
                                            style={{ width: `${incidentProgress}%` }}
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-[#011A80] select-none">
                                            {Math.round(incidentProgress)}%
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isCompleted || isMutating}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            reassignMutation.mutate(incident);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all min-w-[85px] border shadow-sm ${
                                            isCompleted
                                                ? 'bg-slate-400 text-white border-slate-400 opacity-60 cursor-not-allowed'
                                                : isMutating
                                                  ? 'bg-blue-300 text-white border-blue-300 cursor-wait'
                                                  : isSuccess
                                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                                    : isError
                                                      ? 'bg-rose-600 text-white border-rose-600'
                                                      : 'bg-[#011A80] text-white border-[#011A80] hover:bg-opacity-90 active:scale-95'
                                        }`}
                                    >
                                        {isCompleted ? '✓ Completed' : isMutating ? 'Assigning...' : isSuccess ? '✓ Assigned' : isError ? 'Failed' : 'Reassign'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-2 pt-1.5 border-t border-blue-200/40 text-[9px] font-bold text-slate-500">
                                    <div>
                                        Receiving Date: <span className="text-slate-700 font-semibold">{incident.created_on ? incident.created_on.substring(0, 10) : 'NA'}</span>
                                    </div>
                                    <div>
                                        Handled Time: <span className="text-slate-700 font-semibold">{handledTime[incidentId] ?? 'NA'}</span>
                                    </div>
                                    <div>
                                        Receiving Time: <span className="text-slate-700 font-semibold">{incident.created_on ? incident.created_on.substring(11, 19) : 'NA'}</span>
                                    </div>
                                    {tokensUsed[incidentId] ? (
                                        <div className="col-span-2 mt-0.5 text-slate-700 flex items-center gap-1 font-extrabold text-[10px]">
                                            <Coins className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                            <span>Tokens Allocated:</span>
                                            <span>{tokensUsed[incidentId].toLocaleString()}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <FasteLogModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                incidentId={selectedIncidentId ?? ''}
                logs={selectedIncidentId ? getIncidentLogs(selectedIncidentId) : []}
                isDisconnected={selectedIncidentId ? Boolean(wsDisconnected[selectedIncidentId]) : false}
                onDownload={downloadLogs}
            />
        </div>
    );
};
