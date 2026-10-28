export interface Ticket {
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
}

export interface ReassignPayload {
    assignedTo: string;
    workNotes: string;
    shortDescription: string;
    description: string;
}

export const ESCALATION_METRICS_SCHEMA = [
    { key: 'SOP Not Found', display: 'SOP Not Found' },
    { key: 'SOP gap', display: 'SOP Gap' },
    { key: 'Connectivity issues', display: 'Connectivity Issues' },
    { key: 'access issue', display: 'Access Issue' },
    { key: 'error', display: 'Error' },
    { key: 'timeout', display: 'Timeout' },
] as const;

export type EscalationMetricKey = (typeof ESCALATION_METRICS_SCHEMA)[number]['key'];
