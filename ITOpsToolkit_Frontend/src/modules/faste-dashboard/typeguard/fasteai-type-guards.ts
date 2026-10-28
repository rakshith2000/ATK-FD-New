import type { ExtendedTicket } from '../components/smart/FasteActiveTickets/FasteActiveTickets';
import type { Ticket, ReassignPayload } from '../services/types';

function isStringOrNullOrUndefined(v: unknown): v is string | null | undefined {
    return v === undefined || v === null || typeof v === 'string';
}

function isStringNumberNullOrUndefined(v: unknown): v is string | number | null | undefined {
    return v === undefined || v === null || typeof v === 'string' || typeof v === 'number';
}

export function isStringArray(v: unknown): v is string[] {
    return Array.isArray(v) && v.every((item) => typeof item === 'string');
}

export function isFasteTicket(value: unknown): value is Ticket {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.number === 'string' &&
        isStringNumberNullOrUndefined(v.id) &&
        isStringNumberNullOrUndefined(v.ticket_id) &&
        isStringOrNullOrUndefined(v.created_on) &&
        isStringOrNullOrUndefined(v.dashboard_category) &&
        isStringOrNullOrUndefined(v.ticket_category) &&
        isStringOrNullOrUndefined(v.short_description) &&
        isStringOrNullOrUndefined(v.description) &&
        isStringOrNullOrUndefined(v.assignment_group) &&
        isStringOrNullOrUndefined(v.assigned_to) &&
        isStringOrNullOrUndefined(v.cmdb_ci) &&
        (v.resolved === undefined || typeof v.resolved === 'boolean' || typeof v.resolved === 'string') &&
        (v.escalation_state === undefined || typeof v.escalation_state === 'boolean' || typeof v.escalation_state === 'string') &&
        (v.escalation_category === undefined || isStringArray(v.escalation_category))
    );
}

export function isFasteTicketArray(value: unknown): value is Ticket[] {
    return Array.isArray(value) && value.every(isFasteTicket);
}

export function isExtendedTicket(value: unknown): value is ExtendedTicket {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.number === 'string' &&
        isStringNumberNullOrUndefined(v.id) &&
        isStringNumberNullOrUndefined(v.ticket_id) &&
        isStringOrNullOrUndefined(v.created_on) &&
        isStringOrNullOrUndefined(v.dashboard_category) &&
        isStringOrNullOrUndefined(v.ticket_category) &&
        isStringOrNullOrUndefined(v.short_description) &&
        isStringOrNullOrUndefined(v.description) &&
        isStringOrNullOrUndefined(v.assignment_group) &&
        isStringOrNullOrUndefined(v.assigned_to) &&
        isStringOrNullOrUndefined(v.cmdb_ci) &&
        (v.priority === undefined || typeof v.priority === 'string' || typeof v.priority === 'number') &&
        (v.resolved === undefined || typeof v.resolved === 'boolean' || typeof v.resolved === 'string') &&
        (v.escalation_state === undefined || typeof v.escalation_state === 'boolean' || typeof v.escalation_state === 'string') &&
        (v.escalation_category === undefined || isStringArray(v.escalation_category))
    );
}

export function isReassignPayload(value: unknown): value is ReassignPayload {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return typeof v.assignedTo === 'string' && typeof v.workNotes === 'string' && typeof v.shortDescription === 'string' && typeof v.description === 'string';
}

export function isFlagTrue(value: boolean | string | undefined | null): value is true | 'true' | 'TRUE' {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value === true;
    return value.toLowerCase().trim() === 'true';
}
