import type { SnowFieldWithValueAndDisplayText } from '.';

export type SnowTicketType = 'incident' | 'problem_task' | 'problem' | 'sc_request';

export type SnowTicketAssignmentFilterType = 'assigned-to-user' | 'assignemnt-group' | 'unassigned';

export type SnowTicketField = SnowFieldWithValueAndDisplayText;

export type SnowTicket = Record<string, SnowTicketField>;
