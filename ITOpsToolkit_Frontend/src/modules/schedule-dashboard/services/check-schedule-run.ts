import type { ScheduleTask } from '../types/types';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const checkScheduleRun = (t: ScheduleTask): boolean => {
    const sp = t.schedulePeriod || {};
    const startdata = sp.startdata || '';
    if (!startdata) return false;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (startdata > todayStr) return false;
    if (sp.enddate && sp.enddate < todayStr) return false;

    if (sp.weekly) {
        const weekdayConfig = (sp.weekday || '').toLowerCase();
        const currentDayName = WEEKDAYS[today.getDay()];
        const currentDayIdx = String(today.getDay());

        return weekdayConfig === currentDayName || weekdayConfig === currentDayIdx;
    }

    if (sp.monthly) {
        if (sp.recurrencedate && sp.recurrencedate > 0) {
            return today.getDate() === sp.recurrencedate;
        }
        return false;
    }
    return startdata === todayStr;
};
