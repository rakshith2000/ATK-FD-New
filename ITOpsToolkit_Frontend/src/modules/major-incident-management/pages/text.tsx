import { useState, useMemo } from 'react';
import { Route } from '@/routes/(app)/_app/(itops-ai)/itops-ai/(major-incident-management)/major-incident-management/incident-analysis';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Circle,
    Server,
    Users,
    Video,
    Search,
    AlertTriangle,
    ShieldAlert,
    Copy,
    Check,
    RefreshCw,
    ExternalLink,
    Terminal,
    Wrench,
    FileText,
    Activity,
    Layers,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

export type StageStatus = 'completed' | 'active' | 'pending';

export interface MIMStageItem {
    id: number;
    title: string;
    status: StageStatus;
    subtitle: string;
    timestamp?: string;
    actor?: string;
    details: {
        key: string;
        value: string;
        badge?: string;
        isCode?: boolean;
    }[];
    notes?: string;
    queuedActions?: string[];
}

const DUMMY_STAGES: MIMStageItem[] = [
    {
        id: 1,
        title: 'Acknowledgment',
        status: 'completed',
        subtitle: 'Incident logged & acknowledged',
        timestamp: '2026-03-13 07:45:06',
        actor: 'User 599350',
        details: [
            { key: 'Logged By User', value: '599350' },
            { key: 'Timestamp', value: '2026-03-13 07:45:06' },
            { key: 'Initial Severity', value: 'Sev-1 / P1', badge: 'bg-red-50 text-red-700 border-red-200' },
        ],
        notes: 'Ticket acknowledged within 2 minutes of automated monitoring trigger.',
    },
    {
        id: 2,
        title: 'Agent - Identify Issue',
        status: 'completed',
        subtitle: 'Assignment group & CI isolated',
        timestamp: '2026-03-13 07:47:12',
        actor: 'ZenossGroup',
        details: [
            { key: 'Assignment Group', value: 'ZenossGroup', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
            { key: 'Configuration Item', value: 'KonaKart-App', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
            { key: 'Category', value: 'Software / Application Outage' },
        ],
        notes: 'Initial classification isolated to application layer on KonaKart service cluster.',
    },
    {
        id: 3,
        title: 'Identify Changes & Required People',
        status: 'completed',
        subtitle: '3 key stakeholders mapped',
        timestamp: '2026-03-13 07:50:00',
        actor: 'MIM System',
        details: [
            { key: 'Mapped Stakeholders', value: 'AdeleV, JoniS, MIMBotlocal' },
            { key: 'Total Invitees', value: '3 Participants' },
            { key: 'Escalation Path', value: 'Level 3 On-Call Operations' },
        ],
        notes: 'Automatically mapped primary SME leads and automated MIM bridge recorder bot.',
    },
    {
        id: 4,
        title: 'Schedule Meeting & Send Invite',
        status: 'completed',
        subtitle: 'MS Teams bridge thread created',
        timestamp: '2026-03-13 07:52:18',
        actor: 'MIM Automation',
        details: [
            {
                key: 'Teams Thread ID',
                value: '19:meeting_MzViYTJjOGItZDAyYy00MmIyLWFjZGMtMjgzMWIyYzI0NTQw@thread.v2',
                isCode: true,
            },
            { key: 'Invite Status', value: 'Dispatched to 3 Members', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        ],
        notes: 'Emergency war room Teams call scheduled and calendar invites synced.',
    },
    {
        id: 5,
        title: 'Start Meeting',
        status: 'completed',
        subtitle: 'Sev-1 bridge call live',
        timestamp: '2026-07-24T07:29:13.146Z',
        actor: 'Bridge Facilitator',
        details: [
            { key: 'Bridge Initiated', value: '2026-07-24 07:29:13 UTC' },
            { key: 'Call Status', value: 'Active Bridge Session' },
            { key: 'Bridge Type', value: 'Sev-1 Major Incident War Room' },
        ],
        notes: 'All 3 primary stakeholders joined the conference bridge.',
    },
    {
        id: 6,
        title: 'Record & Transcript Meeting',
        status: 'completed',
        subtitle: 'Real-time AI transcript stream active',
        timestamp: '2026-07-24T07:30:00.000Z',
        actor: 'MIMBotlocal',
        details: [
            { key: 'Recorder Bot', value: 'MIMBotlocal@m365mcp43268327.onmicrosoft.com', isCode: true },
            { key: 'Transcript Stream', value: 'Enabled & Synced' },
            { key: 'Participant Tracking', value: 'Active' },
        ],
        notes: 'Live audio transcription capturing operational diagnostics in real time.',
    },
    {
        id: 7,
        title: 'Root Cause Analysis (RCA)',
        status: 'active',
        subtitle: 'Unmonitored CI identified as primary factor',
        timestamp: '2026-07-24T07:35:42.000Z',
        actor: 'Lead SME - AdeleV',
        details: [
            { key: 'Unmonitored CI', value: 'KonaKart-App', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
            { key: 'Node IP Address', value: '172.31.4.89', isCode: true },
            { key: 'Operating System', value: 'Windows Server 2022' },
            { key: 'Impact Factor', value: 'Delayed anomaly detection due to missing agent telemetry' },
        ],
        notes: 'Investigation revealed KonaKart-App host (172.31.4.89) was missing telemetry agent hooks following recent server migration.',
    },
    {
        id: 8,
        title: 'Steps Taken to Resolve',
        status: 'pending',
        subtitle: 'Remediation actions queued',
        queuedActions: [
            'Enable monitoring agent telemetry (Zenoss / Nagios integrations)',
            'Perform dependency and service map topology analysis',
            'Review recent change management logs for KonaKart cluster',
        ],
        details: [
            { key: 'Target System', value: 'Zenoss / Nagios Monitoring Suite' },
            { key: 'Action Status', value: 'Queued for SME execution', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
        ],
    },
    {
        id: 9,
        title: 'Consultation',
        status: 'pending',
        subtitle: 'Review findings with assignment group',
        details: [
            { key: 'Target Group', value: 'ZenossGroup' },
            { key: 'Review Scope', value: 'Permanent fix proposals & Change Request approval' },
        ],
    },
    {
        id: 10,
        title: 'Resolve the Issue',
        status: 'pending',
        subtitle: 'Apply fix & update ticket state',
        details: [
            { key: 'State Transition', value: 'In Progress → Resolved' },
            { key: 'Verification Test', value: 'Healthcheck endpoint HTTP 200 OK' },
        ],
    },
    {
        id: 11,
        title: 'Metrics & Closure',
        status: 'pending',
        subtitle: 'Compute final handling metrics & PIR',
        details: [
            { key: 'SLA Tracking', value: 'MTTR & MTTA calculation' },
            { key: 'Deliverable', value: 'Post-Incident Report (PIR) distribution' },
        ],
    },
];

const IncidentAnalysisPage = () => {
    const search = Route.useSearch();

    const decodedInc = useMemo(() => {
        if (!search?.inc) return 'INC0010001';
        try {
            return atob(search.inc);
        } catch {
            return search.inc;
        }
    }, [search?.inc]);

    const [statusFilter, setStatusFilter] = useState<'all' | StageStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedThreadId, setCopiedThreadId] = useState(false);
    const [activeStageId, setActiveStageId] = useState<number | null>(7);

    const completedCount = useMemo(() => DUMMY_STAGES.filter((s) => s.status === 'completed').length, []);
    const activeCount = useMemo(() => DUMMY_STAGES.filter((s) => s.status === 'active').length, []);
    const pendingCount = useMemo(() => DUMMY_STAGES.filter((s) => s.status === 'pending').length, []);
    const progressPercent = Math.round((completedCount / DUMMY_STAGES.length) * 100);

    const filteredStages = useMemo(() => {
        return DUMMY_STAGES.filter((stage) => {
            const matchesStatus = statusFilter === 'all' || stage.status === statusFilter;
            const matchesSearch =
                stage.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stage.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (stage.actor && stage.actor.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesStatus && matchesSearch;
        });
    }, [statusFilter, searchQuery]);

    const handleCopyThreadId = (threadId: string) => {
        navigator.clipboard.writeText(threadId);
        setCopiedThreadId(true);
        setTimeout(() => setCopiedThreadId(false), 2000);
    };

    return (
        <div className="w-full min-h-screen bg-slate-50/60 p-3 sm:p-5 flex flex-col gap-4 text-slate-800 font-sans">
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-3">
                    <Link
                        to="/itops-ai/major-incident-management"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    >
                        <ArrowLeft size={14} />
                        <span>Back to Dashboard</span>
                    </Link>
                    <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Incident Analysis</span>
                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">{decodedInc}</span>
                        </div>
                        <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">MIM Lifecycle & Root Cause Analysis</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                        title="Refresh Analysis"
                    >
                        <RefreshCw size={13} className="text-slate-500" />
                        <span>Refresh</span>
                    </button>
                    <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                    >
                        <ExternalLink size={13} />
                        <span>View in ServiceNow</span>
                    </button>
                </div>
            </div>

            {/* Main Header Incident Specs Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-red-600">
                            <ShieldAlert size={13} />
                            P1 - Critical
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider">Affected CI</span>
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-700">
                            <Server size={13} />
                            KonaKart-App
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider">Assignment Group</span>
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-purple-700">
                            <Users size={13} />
                            ZenossGroup
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider">Current Stage</span>
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-sky-700">
                            <Activity size={13} className="animate-pulse" />
                            7. RCA (In Progress)
                        </span>
                    </div>
                </div>

                {/* Progress Overview Bar & Quick Stage Stepper */}
                <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                            <Layers size={14} className="text-blue-600" />
                            <span>
                                MIM Lifecycle Progress ({completedCount} of {DUMMY_STAGES.length} Stages Completed)
                            </span>
                        </div>
                        <span className="font-extrabold text-blue-600">{progressPercent}%</span>
                    </div>

                    {/* Progress Track Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                        <div
                            className="bg-linear-to-r from-emerald-500 via-blue-500 to-sky-400 h-full rounded-full transition-all duration-500 shadow-2xs"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* Stage Quick Nodes Bar */}
                    <div className="grid grid-cols-11 gap-1 pt-1 overflow-x-auto no-scrollbar">
                        {DUMMY_STAGES.map((s) => {
                            const isCompleted = s.status === 'completed';
                            const isActive = s.status === 'active';

                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setActiveStageId(s.id)}
                                    title={`Stage ${s.id}: ${s.title}`}
                                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                        activeStageId === s.id
                                            ? 'ring-2 ring-blue-500/40 border-blue-500 bg-blue-50/60 shadow-2xs'
                                            : isCompleted
                                              ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800'
                                              : isActive
                                                ? 'border-sky-300 bg-sky-50 text-sky-800 animate-pulse'
                                                : 'border-slate-200 bg-slate-50 text-slate-400'
                                    }`}
                                >
                                    <span className="leading-none">{s.id}</span>
                                    {isCompleted ? (
                                        <CheckCircle2 size={11} className="text-emerald-600" />
                                    ) : isActive ? (
                                        <Clock size={11} className="text-sky-600" />
                                    ) : (
                                        <Circle size={11} className="text-slate-300" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Layout: Left Timeline Feed (8 cols) + Right Specs Drawer (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Left Column: Stage Feed */}
                <div className="lg:col-span-8 flex flex-col gap-3">
                    {/* Controls & Filter Bar */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                All ({DUMMY_STAGES.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('completed')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    statusFilter === 'completed' ? 'bg-emerald-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Completed ({completedCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('active')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    statusFilter === 'active' ? 'bg-sky-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                In Progress ({activeCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('pending')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    statusFilter === 'pending' ? 'bg-slate-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Pending ({pendingCount})
                            </button>
                        </div>

                        <div className="relative flex-1 min-w-44 max-w-64">
                            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search workflow stages..."
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Timeline Feed Container */}
                    <div className="flex flex-col gap-3">
                        {filteredStages.map((stage) => {
                            const isCompleted = stage.status === 'completed';
                            const isActive = stage.status === 'active';
                            const isPending = stage.status === 'pending';
                            const isSelected = activeStageId === stage.id;

                            return (
                                <div
                                    key={stage.id}
                                    id={`stage-${stage.id}`}
                                    onClick={() => setActiveStageId(stage.id)}
                                    className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                                        isActive
                                            ? 'bg-white border-sky-400 ring-2 ring-sky-500/20 shadow-md'
                                            : isCompleted
                                              ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                                              : 'bg-slate-50/70 border-slate-200/80 opacity-85 hover:opacity-100'
                                    } ${isSelected ? 'shadow-md' : ''}`}
                                >
                                    {/* Stage Indicator Bar Left Accent */}
                                    <div
                                        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${isCompleted ? 'bg-emerald-500' : isActive ? 'bg-sky-500' : 'bg-slate-300'}`}
                                    />

                                    <div className="flex flex-col gap-3 pl-2">
                                        {/* Stage Header Row */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                                                        isCompleted
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : isActive
                                                              ? 'bg-sky-100 text-sky-700 animate-pulse'
                                                              : 'bg-slate-200 text-slate-600'
                                                    }`}
                                                >
                                                    {stage.id}
                                                </span>
                                                <div>
                                                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-none">{stage.title}</h3>
                                                    <span className="text-[0.625rem] text-slate-500 font-medium">{stage.subtitle}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {stage.timestamp && (
                                                    <span className="text-[0.625rem] font-medium text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                        <Clock size={10} />
                                                        {stage.timestamp}
                                                    </span>
                                                )}
                                                {isCompleted && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                                                        <CheckCircle2 size={11} />
                                                        Completed
                                                    </span>
                                                )}
                                                {isActive && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-300 text-[10px] font-bold text-sky-700 uppercase tracking-wider animate-pulse">
                                                        <Activity size={11} />
                                                        In Progress
                                                    </span>
                                                )}
                                                {isPending && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500">
                                                        <Circle size={10} />
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stage Metadata Grid */}
                                        {stage.details && stage.details.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                                {stage.details.map((det, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-xs gap-2">
                                                        <span className="text-slate-500 font-medium text-[0.6875rem]">{det.key}:</span>
                                                        {det.isCode ? (
                                                            <div className="flex items-center gap-1 bg-slate-900 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-800 max-w-full truncate">
                                                                <Terminal size={10} className="shrink-0" />
                                                                <span className="truncate">{det.value}</span>
                                                                {det.key.includes('Teams Thread') && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCopyThreadId(det.value);
                                                                        }}
                                                                        className="ml-1 text-slate-400 hover:text-white cursor-pointer"
                                                                        title="Copy Thread ID"
                                                                    >
                                                                        {copiedThreadId ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className={`font-semibold text-slate-800 truncate ${
                                                                    det.badge ? `px-2 py-0.5 rounded-md border text-[10px] ${det.badge}` : ''
                                                                }`}
                                                            >
                                                                {det.value}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Queued Action Items for Pending Stage */}
                                        {stage.queuedActions && (
                                            <div className="flex flex-col gap-1.5 bg-slate-100/70 p-2.5 rounded-xl border border-slate-200/60">
                                                <span className="text-[0.625rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                    <Wrench size={11} className="text-slate-400" />
                                                    Queued Action Items:
                                                </span>
                                                <ul className="flex flex-col gap-1 text-xs text-slate-700">
                                                    {stage.queuedActions.map((act, i) => (
                                                        <li key={i} className="flex items-start gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                                                            <span>{act}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Stage Notes Summary */}
                                        {stage.notes && (
                                            <p className="text-[0.6875rem] text-slate-600 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">"{stage.notes}"</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Diagnostics & Specs Drawer */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                    {/* Active RCA Diagnostic Highlights Card */}
                    <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={15} className="text-amber-400 animate-pulse" />
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Active Diagnostic Target</span>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">Stage 7 RCA</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Target CI:</span>
                                <span className="font-extrabold text-blue-400">KonaKart-App</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Host IP:</span>
                                <span className="font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-[10px]">172.31.4.89</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">OS Environment:</span>
                                <span className="font-semibold text-slate-200">Windows Server 2022</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Monitoring Status:</span>
                                <span className="font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60 text-[10px]">Unmonitored Agent</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 text-[0.6875rem] text-slate-300 leading-relaxed">
                            <strong className="text-amber-300">RCA Finding:</strong> Primary detection lag resulted from missing Nagios/Zenoss telemetry hooks on node{' '}
                            <code className="text-emerald-400 font-mono">172.31.4.89</code>.
                        </div>
                    </div>

                    {/* Bridge & Stakeholder Hub */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                                <Video size={14} className="text-blue-600" />
                                Bridge & Communication
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Live Session</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider">Teams Meeting Thread</span>
                            <div className="p-2 rounded-xl bg-slate-900 text-emerald-400 text-[10px] font-mono flex items-center justify-between gap-1 border border-slate-800">
                                <span className="truncate">19:meeting_MzViYTJjOGIt...</span>
                                <button
                                    type="button"
                                    onClick={() => handleCopyThreadId('19:meeting_MzViYTJjOGItZDAyYy00MmIyLWFjZGMtMjgzMWIyYzI0NTQw@thread.v2')}
                                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                    title="Copy full Thread ID"
                                >
                                    {copiedThreadId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                            <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider">Active Stakeholders (3)</span>
                            <div className="flex flex-wrap gap-1.5">
                                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1">
                                    <Users size={11} className="text-blue-600" />
                                    AdeleV
                                </span>
                                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1">
                                    <Users size={11} className="text-blue-600" />
                                    JoniS
                                </span>
                                <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 flex items-center gap-1">
                                    <Activity size={11} className="text-blue-600 animate-pulse" />
                                    MIMBotlocal (Bot)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* AI Incident Summary Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col gap-2.5">
                        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <FileText size={14} className="text-purple-600" />
                            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-tight">AI Assistant Summary</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Incident acknowledged and bridge active. Stage 7 RCA identified unmonitored node{' '}
                            <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">KonaKart-App (172.31.4.89)</code>. Queued resolution actions
                            ready for SME execution.
                        </p>

                        <div className="flex flex-col gap-1.5 pt-1">
                            <button
                                type="button"
                                className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                                <FileText size={13} />
                                <span>Generate Draft Post-Incident Report</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncidentAnalysisPage;
