import type { Tower, TaskStatus, StepStatus, HealthStatus, SchedulePeriod, ScheduleTask, SopItem, CiItem, DashboardMetrics, DashboardData, ReportData } from '../types/types';

function isString(v: unknown): v is string {
    return typeof v === 'string';
}

function isNumber(v: unknown): v is number {
    return typeof v === 'number';
}

function isBoolean(v: unknown): v is boolean {
    return typeof v === 'boolean';
}

function isStringOrNullOrUndefined(v: unknown): v is string | null | undefined {
    return v === undefined || v === null || typeof v === 'string';
}

export function isStringArray(v: unknown): v is string[] {
    return Array.isArray(v) && v.every((item) => typeof item === 'string');
}

export function isTower(v: unknown): v is Tower {
    return typeof v === 'string' && ['Windows', 'Linux', 'Database', 'Network'].includes(v);
}

export function isTaskStatus(v: unknown): v is TaskStatus {
    return typeof v === 'string' && ['Scheduled', 'Completed', 'Failed', 'Triggered', 'Awaiting'].includes(v);
}

export function isStepStatus(v: unknown): v is StepStatus {
    return typeof v === 'string' && ['SUCCESS', 'FAILED', 'PARTIAL_SUCCESS', 'SKIPPED'].includes(v);
}

export function isHealthStatus(v: unknown): v is HealthStatus {
    return typeof v === 'string' && ['SUCCESS', 'FAILED', 'HEALTHY', 'WARNING', 'CRITICAL', 'UNKNOWN', 'Ready'].includes(v);
}

export function isSchedulePeriod(value: unknown): value is SchedulePeriod {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        isString(v.startdata) &&
        isString(v.starttime) &&
        isString(v.enddate) &&
        isBoolean(v.weekly) &&
        isString(v.weekday) &&
        isBoolean(v.monthly) &&
        isNumber(v.recurrencedate) &&
        isNumber(v.weeknumber) &&
        isString(v.monthlyweekday) &&
        isStringOrNullOrUndefined(v.incident_number) &&
        (v.trigger_requested === undefined || isBoolean(v.trigger_requested))
    );
}

export function isCiItem(value: unknown): value is CiItem {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return isString(v.sys_id) && isString(v.name);
}

export function isCiItemArray(value: unknown): value is CiItem[] {
    return Array.isArray(value) && value.every(isCiItem);
}

export function isSopItem(value: unknown): value is SopItem {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        (typeof v.id === 'string' || typeof v.id === 'number') &&
        isString(v.sop_name) &&
        isString(v.sop_content) &&
        isStringOrNullOrUndefined(v.category) &&
        isStringOrNullOrUndefined(v.is_approved) &&
        isStringOrNullOrUndefined(v.created_by) &&
        isStringOrNullOrUndefined(v.created_on) &&
        isStringOrNullOrUndefined(v.last_observed_on)
    );
}

export function isSopItemArray(value: unknown): value is SopItem[] {
    return Array.isArray(value) && value.every(isSopItem);
}

export function isScheduleTask(value: unknown): value is ScheduleTask {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        isString(v._id) &&
        isString(v.taskName) &&
        isString(v.description) &&
        isTower(v.tower) &&
        isString(v.sop) &&
        isString(v.reportType) &&
        isString(v.reportFormat) &&
        isBoolean(v.ticketRequired) &&
        isStringArray(v.ciItems) &&
        isTaskStatus(v.status) &&
        (v.schedulePeriod === undefined ||
            typeof v.schedulePeriod !== 'object' ||
            v.schedulePeriod === null ||
            isSchedulePeriod(v.schedulePeriod) ||
            Object.keys(v.schedulePeriod).length === 0)
    );
}

export function isScheduleTaskArray(value: unknown): value is ScheduleTask[] {
    return Array.isArray(value) && value.every(isScheduleTask);
}

export function isDashboardMetrics(value: unknown): value is DashboardMetrics {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    const keys: (keyof DashboardMetrics)[] = ['total', 'scheduled', 'completed', 'failed', 'triggered', 'awaiting', 'windows', 'linux', 'database', 'network'];
    return keys.every((k) => isNumber(v[k]));
}

export function isDashboardData(value: unknown): value is DashboardData {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return isDashboardMetrics(v.metrics) && isScheduleTaskArray(v.tasks);
}

export function isReportData(value: unknown): value is ReportData {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;

    if (typeof v.task !== 'object' || v.task === null) return false;
    const taskObj = v.task as Record<string, unknown>;

    if (typeof v.summary !== 'object' || v.summary === null) return false;
    const summaryObj = v.summary as Record<string, unknown>;

    return (
        isString(taskObj.taskName) &&
        isTower(taskObj.tower) &&
        isString(taskObj.sop) &&
        isTaskStatus(taskObj.status) &&
        isBoolean(taskObj.ticketRequired) &&
        isStringOrNullOrUndefined(taskObj.incidentNumber) &&
        isHealthStatus(summaryObj.overall_status) &&
        isNumber(summaryObj.total_cis) &&
        isNumber(summaryObj.total_steps) &&
        isNumber(summaryObj.steps_success) &&
        isNumber(summaryObj.steps_failed) &&
        Array.isArray(summaryObj.ci_rows) &&
        Array.isArray(v.ci_reports) &&
        Array.isArray(v.health_summaries)
    );
}
