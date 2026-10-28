import schedulerAxios from '../../../api/axios-clients/fasteai/schedulerAxios';
import type { ScheduleTask } from '../types/types';

export const triggerAndDownloadReport = async (item: ScheduleTask, ciIndex?: number): Promise<boolean> => {
    const params = typeof ciIndex === 'number' ? { params: { ci_index: ciIndex } } : undefined;
    const genRes = await schedulerAxios.post(`/report/generate/${item._id}`, undefined, params);

    if (genRes.data?.success && genRes.data?.filename) {
        const downloadUrl = `${schedulerAxios.defaults.baseURL}/report/download/${genRes.data.filename}`;
        const fileRes = await fetch(downloadUrl);
        if (fileRes.ok) {
            const blob = await fileRes.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = genRes.data.filename;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        }
    }
    return false;
};
