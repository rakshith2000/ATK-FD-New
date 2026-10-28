import appConfig from '../../../../public/app-config.json';
import { getToken } from '../../../api/axios-clients/fasteai/fasteaiAuth';

export interface ServiceNowConfig {
    serviceNow?: {
        api?: {
            baseUrl?: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

const SNOW_TABLE: Record<string, string> = {
    INC: 'incident.do',
    REQ: 'sc_request.do',
    CHG: 'change_request.do',
};

export function getApiConfig(): ServiceNowConfig {
    if (typeof window !== 'undefined') {
        const windowConfig = (window as unknown as { APP_CONFIG?: ServiceNowConfig }).APP_CONFIG;
        if (windowConfig) {
            return windowConfig;
        }
    }

    return (appConfig as ServiceNowConfig) ?? {};
}

export function getSnowTicketUrl(ticketNumber: string): string {
    const cfg = getApiConfig();
    const rawBaseUrl = cfg.serviceNow?.api?.baseUrl ?? '';

    if (!rawBaseUrl) {
        // eslint-disable-next-line no-console
        console.error('ServiceNow base URL is not defined in application configuration.');
    }

    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const num = ticketNumber.toUpperCase();
    const prefix = Object.keys(SNOW_TABLE).find((p) => num.startsWith(p));
    const table = prefix ? SNOW_TABLE[prefix] : 'task.do';

    return `${baseUrl}/${table}?sysparm_query=number=${num}`;
}

export function openSnowTicket(ticketNumber: string): void {
    if (!ticketNumber) return;

    const token = getToken();
    if (!token) {
        // eslint-disable-next-line no-console
        console.warn('No authentication token available — user may need to re-authenticate.');
    }

    const url = getSnowTicketUrl(ticketNumber);
    window.open(url, '_blank', 'noopener,noreferrer');
}

export { getToken };
