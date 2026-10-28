import { useState, useEffect } from 'react';
import { FASTEAI_CORE_WS, FASTEAI_CORE_BASE, getValidToken } from '../../../api/axios-clients/fasteai/fasteaiAuth';

export const useLiveTicketStream = (): string[] => {
    const [ticketNumbers, setTicketNumbers] = useState<string[]>([]);

    useEffect(() => {
        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
        let isCancelled = false;

        const extractNumbers = (rawData: unknown): string[] => {
            if (!rawData) return [];

            if (Array.isArray(rawData)) {
                return rawData.map((item) => String(item).trim());
            }

            if (typeof rawData === 'object' && rawData !== null) {
                const record = rawData as Record<string, unknown>;
                const possibleList = record.ticket_numbers ?? record.tickets ?? record.data;
                if (Array.isArray(possibleList)) {
                    return possibleList.map((item) => String(item).trim());
                }
            }

            if (typeof rawData === 'string' || typeof rawData === 'number') {
                return [String(rawData).trim()];
            }

            return [];
        };

        const connectWebSocket = async () => {
            try {
                const token = await getValidToken(FASTEAI_CORE_BASE);

                if (isCancelled) return;

                ws = new WebSocket(`${FASTEAI_CORE_WS}/ws/ticket_list`);

                ws.onopen = () => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ token }));
                    }
                };

                ws.onmessage = (event: MessageEvent) => {
                    try {
                        const parsed: unknown = JSON.parse(event.data);
                        const extracted = extractNumbers(parsed);
                        setTicketNumbers(extracted);
                    } catch {
                        if (typeof event.data === 'string' && event.data.trim()) {
                            setTicketNumbers([event.data.trim()]);
                        }
                    }
                };

                ws.onerror = () => {
                    // Silently handled by reconnection cycle
                };

                ws.onclose = () => {
                    if (!isCancelled) {
                        reconnectTimeout = setTimeout(() => {
                            void connectWebSocket();
                        }, 5000);
                    }
                };
            } catch {
                if (!isCancelled) {
                    reconnectTimeout = setTimeout(() => {
                        void connectWebSocket();
                    }, 5000);
                }
            }
        };

        void connectWebSocket();

        return () => {
            isCancelled = true;
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }

            if (ws) {
                ws.onopen = null;
                ws.onclose = null;
                ws.onerror = null;
                ws.onmessage = null;

                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
            }
        };
    }, []);

    return ticketNumbers;
};
