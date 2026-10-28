import { useState, useEffect, useRef, useCallback } from 'react';

interface LogMessage {
    time?: string;
    source?: string;
    message?: string;
    content?: {
        text?: string;
        duration?: number | string;
        total_tokens?: number | string;
        type?: string;
    };
    [key: string]: unknown;
}

interface IncidentItem {
    number?: string;
}

interface LiveLogContent {
    text?: string;
    duration?: number | string;
    total_tokens?: number | string;
    type?: string;
}

interface LiveLogFrame {
    time?: string;
    source?: string;
    message?: string;
    content?: LiveLogContent;
    [key: string]: unknown;
}

interface FetchLikeResponse {
    status: number;
    data: unknown;
}

type FasteaiFetchLike = (url: string, baseUrl: string) => Promise<FetchLikeResponse>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isLiveLogContent = (value: unknown): value is LiveLogContent => {
    if (!isRecord(value)) return false;
    return (
        (value.text === undefined || (typeof value.text === 'string' && true)) &&
        (value.duration === undefined || typeof value.duration === 'number' || typeof value.duration === 'string') &&
        (value.total_tokens === undefined || typeof value.total_tokens === 'number' || typeof value.total_tokens === 'string') &&
        (value.type === undefined || typeof value.type === 'string')
    );
};

const isLiveLogFrame = (value: unknown): value is LiveLogFrame => {
    if (!isRecord(value)) return false;
    return (
        (value.time === undefined || typeof value.time === 'string') &&
        (value.source === undefined || typeof value.source === 'string') &&
        (value.message === undefined || typeof value.message === 'string') &&
        (value.content === undefined || isLiveLogContent(value.content))
    );
};

const extractLogs = (payload: unknown): LiveLogFrame[] => {
    if (Array.isArray(payload)) return payload.filter(isLiveLogFrame);
    if (!isRecord(payload)) return [];

    const candidate = payload.logs ?? payload.data ?? payload.result;
    return Array.isArray(candidate) ? candidate.filter(isLiveLogFrame) : [];
};

export const useLiveTaskLogs = (incidentData: IncidentItem[], fasteaiFetch: FasteaiFetchLike, FASTEAI_CORE_BASE: string, FASTEAI_CORE_WS: string) => {
    const [allReceivedLogs, setAllReceivedLogs] = useState<Record<string, LogMessage[]>>({});
    const [progress, setProgress] = useState<Record<string, number>>({});
    const [handledTime, setHandledTime] = useState<Record<string, string>>({});
    const [tokensUsed, setTokensUsed] = useState<Record<string, number>>({});
    const [completedTickets, setCompletedTickets] = useState<Set<string>>(new Set());
    const [wsDisconnected, setWsDisconnected] = useState<Record<string, boolean>>({});

    const wsRefs = useRef<Record<string, WebSocket>>({});
    const completionTimers = useRef<Record<string, NodeJS.Timeout>>({});
    const COMPLETION_HOLD_MS = 2 * 60 * 1000; // 2 minutes hold

    const scheduleCompletion = useCallback((ticketNumber: string) => {
        if (completionTimers.current[ticketNumber]) return;
        completionTimers.current[ticketNumber] = setTimeout(() => {
            setCompletedTickets((prev) => new Set([...prev, ticketNumber]));
            delete completionTimers.current[ticketNumber];
        }, COMPLETION_HOLD_MS);
    }, []);

    const applyCompletionLog = useCallback(
        (ticketNumber: string, content: LiveLogContent) => {
            if (content.duration !== undefined && content.total_tokens !== undefined) {
                const durSeconds = parseFloat(String(content.duration));
                if (!isNaN(durSeconds)) {
                    const mins = Math.floor(durSeconds / 60);
                    const secs = Math.round(durSeconds % 60);
                    setHandledTime((prev) => ({ ...prev, [ticketNumber]: `${mins}m ${secs}s` }));
                }
                if (content.total_tokens != null) {
                    setTokensUsed((prev) => ({ ...prev, [ticketNumber]: Number(content.total_tokens) }));
                }
                setProgress((prev) => ({ ...prev, [ticketNumber]: 100 }));
                scheduleCompletion(ticketNumber);
            }
        },
        [scheduleCompletion],
    );

    useEffect(() => {
        const fetchExistingLogs = async () => {
            for (const incident of incidentData) {
                const ticketNumber = incident.number;
                if (!ticketNumber) continue;
                try {
                    const response = await fasteaiFetch(`${FASTEAI_CORE_BASE}/current-tasks/${ticketNumber}/logs`, FASTEAI_CORE_BASE);
                    if (response.status >= 200 && response.status < 300) {
                        const logs = extractLogs(response.data);
                        if (logs.length > 0) {
                            setAllReceivedLogs((prev) => ({ ...prev, [ticketNumber]: logs }));
                            let completedSteps = 0;
                            let foundCompletion = false;

                            for (const log of logs) {
                                const content = log.content;
                                if (content) {
                                    if (content.duration !== undefined && content.total_tokens !== undefined) {
                                        applyCompletionLog(ticketNumber, content);
                                        foundCompletion = true;
                                    }
                                    if (content.type === 'WorkflowComplete') {
                                        setProgress((prev) => ({ ...prev, [ticketNumber]: 100 }));
                                        scheduleCompletion(ticketNumber);
                                        foundCompletion = true;
                                    }
                                }
                                const msg = String(log.message || '');
                                if (msg.includes('Task completed') || msg.includes('TERMINATE') || msg.includes('finished with status')) {
                                    setProgress((prev) => ({ ...prev, [ticketNumber]: 100 }));
                                    scheduleCompletion(ticketNumber);
                                    foundCompletion = true;
                                }
                                if (msg.includes('completed') || msg.includes('✅')) completedSteps++;
                            }

                            if (!foundCompletion) {
                                const totalSteps = Math.max(completedSteps + 2, 5);
                                setProgress((prev) => ({ ...prev, [ticketNumber]: Math.min((completedSteps / totalSteps) * 100, 90) }));
                            }
                        }
                    }
                } catch {}
            }
        };
        if (incidentData.length > 0) fetchExistingLogs();
    }, [incidentData, applyCompletionLog, fasteaiFetch, FASTEAI_CORE_BASE]);

    useEffect(() => {
        incidentData.forEach((incident) => {
            const ticketNumber = incident.number;
            if (!ticketNumber) return;

            const existingWs = wsRefs.current[ticketNumber];
            if (existingWs && (existingWs.readyState === WebSocket.OPEN || existingWs.readyState === WebSocket.CONNECTING)) return;

            try {
                const ws = new WebSocket(`${FASTEAI_CORE_WS}/ws/task/${ticketNumber}`);
                wsRefs.current[ticketNumber] = ws;

                ws.onopen = () => {
                    setWsDisconnected((prev) => ({ ...prev, [ticketNumber]: false }));
                };

                ws.onmessage = (event) => {
                    try {
                        const parsedFrame: unknown = JSON.parse(event.data);
                        if (!isLiveLogFrame(parsedFrame)) return;
                        const logMessage = parsedFrame;
                        setAllReceivedLogs((prev) => {
                            const existingLogs = prev[ticketNumber] || [];
                            const isDuplicate = existingLogs.some((log) => log.time === logMessage.time && log.message === logMessage.message);
                            if (!isDuplicate) return { ...prev, [ticketNumber]: [...existingLogs, logMessage] };
                            return prev;
                        });

                        const msgContent = logMessage.content;
                        if (msgContent && typeof msgContent === 'object') {
                            if (msgContent.duration !== undefined && msgContent.total_tokens !== undefined) {
                                applyCompletionLog(ticketNumber, msgContent);
                            } else if (msgContent.type === 'WorkflowComplete') {
                                setProgress((prev) => ({ ...prev, [ticketNumber]: 100 }));
                                scheduleCompletion(ticketNumber);
                            }
                        }

                        setProgress((prev) => {
                            const currentProgress = prev[ticketNumber] || 0;
                            if (currentProgress >= 100) return prev;
                            if (logMessage.message?.includes('completed') || logMessage.message?.includes('✅'))
                                return { ...prev, [ticketNumber]: Math.min(currentProgress + 10, 90) };
                            return { ...prev, [ticketNumber]: Math.min(currentProgress + 2, 85) };
                        });

                        if (logMessage.message?.includes('Task completed') || logMessage.message?.includes('TERMINATE') || logMessage.message?.includes('finished with status')) {
                            setProgress((prev) => ({ ...prev, [ticketNumber]: 100 }));
                            scheduleCompletion(ticketNumber);
                        }
                    } catch {}
                };

                ws.onclose = (e) => {
                    if (e.code !== 1000) setWsDisconnected((prev) => ({ ...prev, [ticketNumber]: true }));
                };

                ws.onerror = () => {
                    setWsDisconnected((prev) => ({ ...prev, [ticketNumber]: true }));
                };
            } catch {}
        });
    }, [incidentData, applyCompletionLog, FASTEAI_CORE_WS, scheduleCompletion]);

    useEffect(() => {
        return () => {
            Object.values(wsRefs.current).forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
            });
            wsRefs.current = {};
            Object.values(completionTimers.current).forEach(clearTimeout);
        };
    }, []);

    return {
        allReceivedLogs,
        progress,
        handledTime,
        tokensUsed,
        completedTickets,
        wsDisconnected,
    };
};
