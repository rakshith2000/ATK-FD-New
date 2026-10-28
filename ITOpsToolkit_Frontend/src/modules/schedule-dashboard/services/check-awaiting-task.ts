import type { ScheduleTask } from '../types/types';
import { checkScheduleRun } from './check-schedule-run';

export const checkAwaitingTask = (t: ScheduleTask): boolean => {
    const isPendingStatus = t.status === 'Awaiting' || t.status === 'Scheduled';
    return isPendingStatus && checkScheduleRun(t);
};
