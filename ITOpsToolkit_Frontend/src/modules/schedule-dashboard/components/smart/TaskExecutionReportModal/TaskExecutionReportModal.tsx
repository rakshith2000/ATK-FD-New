import React, { useState } from 'react';
import { Download, ChevronUp, ChevronDown, Check, XCircle, Minus } from 'lucide-react';
import { useReportPreview } from '../../../hooks/useDashboardData';
import { downloadLogs } from '../../../services/get-download-logs';
import Modal from '@/shared/components/ui/Modal/Modal';
import type { ScheduleTask, StepData, ReportData, CiReport } from '../../../types/types';

interface ModalProps {
    task: ScheduleTask;
    onClose: () => void;
}

interface StatItem {
    label: string;
    value: React.ReactNode;
    bg?: string;
    textCl?: string;
    isBadg?: boolean;
}

const STATUS_BG: Record<string, string> = {
    SUCCESS: 'bg-green-700',
    FAILED: 'bg-red-700',
    'PARTIAL SUCCESS': 'bg-amber-600',
    HEALTHY: 'bg-green-700',
    WARNING: 'bg-amber-600',
    CRITICAL: 'bg-red-700',
    UNKNOWN: 'bg-gray-500',
    Ready: 'bg-sky-700',
};

function formatOutputForDisplay(output: string): string {
    const out = (output || '').replace(/[^\x00-\xFF]+/g, '').trim();
    return out || 'No output captured';
}

function generateRecommendations(steps: StepData[]): string[] {
    const recs: string[] = [];
    let hasIssues = false;

    for (const step of steps) {
        const out = (step.output || '').toLowerCase();
        const raw = step.output || '';
        const snip = step.title || 'Step';

        if (step.status === 'FAILED') {
            hasIssues = true;
            if (/\b(ssh|timeout|connect(?:ion)?|unreachable|refused|timed?\s*out)\b/.test(out)) {
                recs.push(`Connectivity failure on '${snip}': Verify the host is online, check firewall rules, and confirm SSH/WinRM credentials.`);
            } else if (/\b(no\s+space|disk\s+full|filesystem.*full|quota\s+exceeded)\b/.test(out)) {
                recs.push(`Step '${snip}' failed due to disk-full condition: Free disk space immediately before retrying.`);
            } else if (/\b(permission\s+denied|access\s+denied|not\s+authorized|unauthorized)\b/.test(out)) {
                recs.push(`Permission denied on '${snip}': Verify the executing account has sufficient privileges.`);
            } else if (/\b(not\s+found|command\s+not\s+found|no\s+such\s+file)\b/.test(out)) {
                recs.push(`Command/file not found on '${snip}': Verify the tool is installed and the path is correct on the target host.`);
            } else {
                recs.push(`Step failed — '${snip}': Review the output and re-execute manually to diagnose the root cause.`);
            }
        }

        // Disk Usage Parsing
        const diskPcts: number[] = [];
        for (const m of raw.matchAll(/(\d{1,3})%\s*(?:used|usage|full|of\s+disk)/gi)) diskPcts.push(parseInt(m[1], 10));
        for (const m of raw.matchAll(/(\d{1,3})%\s+\//g)) diskPcts.push(parseInt(m[1], 10));
        for (const m of raw.matchAll(/usage\s+at\s+(\d{1,3})%/gi)) diskPcts.push(parseInt(m[1], 10));
        for (const pct of [...new Set(diskPcts)].sort((a, b) => b - a).slice(0, 2)) {
            if (pct >= 90) {
                recs.push(`CRITICAL: Disk at ${pct}% capacity — immediate cleanup or storage expansion required.`);
                hasIssues = true;
            } else if (pct >= 75) {
                recs.push(`Disk usage at ${pct}% — plan for cleanup or capacity expansion within 2 weeks.`);
            }
        }

        let memPct: number | null = null;
        const memM = raw.match(/Mem(?:ory)?:\s+(\d+)\s+(\d+)/);
        if (memM) memPct = Math.round((parseInt(memM[2], 10) / parseInt(memM[1], 10)) * 100);
        if (memPct === null) {
            const totM = raw.match(/Total[^\n]{0,20}?(\d+)\s*(?:MB|GB|KB)?[^\n]*\nUsed[^\n]{0,20}?(\d+)/i);
            if (totM) memPct = Math.round((parseInt(totM[2], 10) / parseInt(totM[1], 10)) * 100);
        }
        if (memPct === null) {
            const ramM = raw.match(/(?:memory|ram)[^\n]{0,20}?(\d{1,3})%/i);
            if (ramM) memPct = parseInt(ramM[1], 10);
        }
        if (memPct !== null && step.status !== 'FAILED') {
            if (memPct >= 90) {
                recs.push(`CRITICAL: Memory at ${memPct}% — identify and stop memory-heavy processes immediately.`);
                hasIssues = true;
            } else if (memPct >= 75) {
                recs.push(`Memory usage at ${memPct}% — monitor for memory leaks and consider adding RAM.`);
            }
        }

        if (step.status !== 'FAILED') {
            for (const svc of (raw.match(/(\S+\.service)\s[^\n]*\bfailed\b/gi) || []).slice(0, 3)) {
                recs.push(`Service '${svc.split(/\s/)[0]}' in failed state — inspect service logs and restart to recover.`);
                hasIssues = true;
            }
        }

        const lossM = raw.match(/(\d+(?:\.\d+)?)%\s+packet\s+loss/i) || raw.match(/Packet\s+loss:\s*([\d.]+)%/i);
        if (lossM) {
            const loss = parseFloat(lossM[1]);
            if (loss > 20) {
                recs.push(`CRITICAL: ${Math.round(loss)}% packet loss — check NIC, network cables, and upstream routing immediately.`);
                hasIssues = true;
            } else if (loss > 0) {
                recs.push(`Network: ${Math.round(loss)}% packet loss detected — monitor stability and investigate intermittent drops.`);
            }
        } else if (/\b(destination\s+host\s+unreachable|request\s+timed?\s+out|network\s+unreachable)\b/.test(out)) {
            recs.push(`Network connectivity issue in '${snip}': Verify routing, DNS, and firewall rules.`);
            hasIssues = true;
        }
    }

    if (!hasIssues) {
        recs.push('All SOP steps completed successfully. System appears healthy and operating within normal parameters. Continue regular monitoring as per schedule.');
    } else if (recs.length === 0) {
        recs.push('Review the detailed step outputs above for specific error details.');
    }
    return recs;
}

export const TaskExecutionReportModal: React.FC<ModalProps> = ({ task, onClose }) => {
    const { data, isLoading, error } = useReportPreview(task._id, true) as {
        data: ReportData | undefined;
        isLoading: boolean;
        error: unknown;
    };

    const [expanded, setExpanded] = useState<string | null>(null);

    const statsList: StatItem[] = data
        ? [
              { label: 'Overall Status', value: String(data.summary.overall_status || ''), bg: STATUS_BG[data.summary.overall_status] || 'bg-gray-500', isBadg: true },
              { label: 'Total CIs', value: String(data.summary.total_cis || 0) },
              { label: 'Total Steps', value: String(data.summary.total_steps || 0) },
              { label: 'Steps Passed', value: String(data.summary.steps_success || 0), textCl: 'text-green-700' },
              { label: 'Steps Failed', value: String(data.summary.steps_failed || 0), textCl: 'text-red-600' },
              ...(task.schedulePeriod?.incident_number ? [{ label: 'Incident', value: String(task.schedulePeriod.incident_number), textCl: 'text-blue-600' }] : []),
          ]
        : [];

    return (
        <Modal open={true} size="7xl" onClose={onClose} className="p-0">
            <Modal.Header className="bg-[#191923] px-6 py-4 flex items-center justify-between mb-0 rounded-t-lg">
                <div className="flex items-center space-x-3">
                    <span className="font-extrabold text-base text-white">Task Execution Report</span>
                    <span className="text-gray-400 text-sm font-medium">{task.taskName}</span>
                </div>
                <div className="flex items-center space-x-3 pr-6">
                    <button
                        type="button"
                        onClick={() => downloadLogs(task)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                        <Download size={11} /> Download PDF
                    </button>
                </div>
            </Modal.Header>

            <Modal.Body className="p-6 overflow-y-auto space-y-6 max-h-[75dvh] mb-0">
                {isLoading && (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 font-medium text-sm">Loading reports...</p>
                    </div>
                )}

                {Boolean(error) && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm font-medium">
                        Failed to load report data. The report may still be generating — try downloading the PDF.
                    </div>
                )}

                {data && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {statsList.map((s, idx: number) => (
                                <div
                                    key={idx}
                                    className={`rounded-xl border p-3 flex flex-col justify-between shadow-sm ${s.isBadg ? `${s.bg} text-white border-transparent` : 'bg-slate-50 border-slate-200'}`}
                                >
                                    <span className={`text-[10px] uppercase tracking-wider font-bold ${s.isBadg ? 'text-white/80' : 'text-gray-500'}`}>{s.label}</span>
                                    <span className={`text-base font-black tracking-wide mt-1 ${s.isBadg ? 'text-white' : s.textCl || 'text-slate-900'}`}>{s.value}</span>
                                </div>
                            ))}
                        </div>

                        <div>
                            <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase border-b-2 border-slate-200 pb-2 mb-3">Execution Summary</h3>
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-900 text-white font-bold">
                                            <th className="py-3 px-4">CI Name</th>
                                            <th className="py-3 px-4">Sys ID</th>
                                            <th className="py-3 px-4">IP Address</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-center">Steps</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {data.summary.ci_rows?.map((row: (string | number | unknown)[], i: number) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                <td className="py-3 px-4 font-bold text-slate-800">{String(row[0] || '—')}</td>
                                                <td className="py-3 px-4 font-mono text-slate-500">{row[1] ? String(row[1]) : <Minus className="w-3.5 h-3.5 text-slate-300" />}</td>
                                                <td className="py-3 px-4 font-mono text-slate-600">{row[2] ? String(row[2]) : <Minus className="w-3.5 h-3.5 text-slate-300" />}</td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`text-[10px] font-black tracking-wide text-white rounded-full px-2.5 py-0.5 ${STATUS_BG[String(row[3])] || 'bg-gray-500'}`}
                                                    >
                                                        {String(row[3] || '')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-bold text-slate-700">{String(row[4] ?? 0)}</td>
                                            </tr>
                                        ))}
                                        {(!data.summary.ci_rows || data.summary.ci_rows.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-slate-400 text-xs">
                                                    No CI data available yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {data.ci_reports?.map((ci: CiReport, idx: number) => {
                            const passed = ci.steps.filter((s) => s.status === 'SUCCESS').length;
                            const failed = ci.steps.filter((s) => s.status === 'FAILED').length;
                            const other = ci.steps.length - passed - failed;
                            const recs = generateRecommendations(ci.steps);
                            const isExpanded = expanded === ci.ci_name;

                            return (
                                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div
                                        onClick={() => setExpanded(isExpanded ? null : ci.ci_name)}
                                        className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="font-bold text-sm text-slate-800">{ci.ci_name}</span>
                                            {ci.resolved_ip && <span className="font-mono text-xs text-slate-400">{ci.resolved_ip}</span>}
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${STATUS_BG[ci.status] || 'bg-gray-500'}`}>
                                                {ci.status}
                                            </span>
                                            <span className="text-xs text-slate-500 bg-slate-200/60 rounded-full px-2.5 py-0.5 font-medium">
                                                {ci.steps.length} steps <span className="text-green-700 font-bold">{passed} passed</span>
                                                {failed > 0 && <span className="text-red-600 font-bold"> / {failed} failed</span>}
                                                {other > 0 && <span className="text-slate-500"> / {other} unknown</span>}
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center justify-center">
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </span>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 space-y-4">
                                            <div>
                                                <h4 className="text-[11px] font-black tracking-wider text-blue-900 mb-2">KEY FINDINGS</h4>
                                                <div className="space-y-2 divide-y divide-slate-100">
                                                    {ci.steps.map((st: StepData, sIdx: number) => {
                                                        const isOk = st.status === 'SUCCESS';
                                                        const isFail = st.status === 'FAILED';
                                                        return (
                                                            <div key={sIdx} className="pt-2 flex items-start space-x-3 text-xs">
                                                                <span
                                                                    className={`w-5 h-5 rounded-full text-white flex items-center justify-center flex-shrink-0 ${isOk ? 'bg-green-600' : isFail ? 'bg-red-600' : 'bg-slate-400'}`}
                                                                >
                                                                    {isOk ? <Check size={10} /> : isFail ? <XCircle size={12} /> : <Minus size={10} />}
                                                                </span>
                                                                <div className="flex-1">
                                                                    <div className="font-bold text-slate-800">{st.title}</div>
                                                                    <div className="text-slate-600 mt-1 font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap break-words leading-relaxed">
                                                                        {formatOutputForDisplay(st.output)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-[11px] font-black tracking-wider text-slate-500 uppercase mb-2">Detailed Commands &amp; Output</h4>
                                                <div className="space-y-3">
                                                    {ci.steps.map((step: StepData, si: number) => (
                                                        <div key={si} className="border-b border-slate-100 pb-3 last:border-none">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-xs text-slate-800">
                                                                    Step {step.step_number}: {step.title}
                                                                </span>
                                                                <span
                                                                    className={`text-[9px] font-bold text-white px-2 py-0.5 rounded-full ${STATUS_BG[step.status] || 'bg-gray-500'}`}
                                                                >
                                                                    {step.status}
                                                                </span>
                                                            </div>
                                                            {step.commands && (
                                                                <div className="mb-1.5">
                                                                    <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Command</div>
                                                                    <pre className="bg-slate-800 text-slate-200 p-2 rounded text-[11px] font-mono whitespace-pre-wrap break-all">
                                                                        {step.commands}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {step.output && (
                                                                <div>
                                                                    <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Output</div>
                                                                    <pre className="bg-slate-950 text-green-400 p-2 rounded text-[11px] font-mono whitespace-pre-wrap break-all">
                                                                        {step.output}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Recommendations */}
                                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                                <h4 className="text-[11px] font-black tracking-wider text-blue-950 mb-2">RECOMMENDATIONS</h4>
                                                <ul className="space-y-1.5">
                                                    {recs.map((rec: string, rIdx: number) => (
                                                        <li key={rIdx} className="text-xs text-slate-700 flex items-start">
                                                            <span className={`font-bold mr-2 ${rec.startsWith('CRITICAL:') ? 'text-red-600' : 'text-blue-600'}`}>{rIdx + 1}.</span>
                                                            <span className={rec.startsWith('CRITICAL:') ? 'text-red-900 font-bold' : ''}>{rec}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};
