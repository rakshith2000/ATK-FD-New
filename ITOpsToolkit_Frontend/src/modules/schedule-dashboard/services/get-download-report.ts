import schedulerAxios from '../../../api/axios-clients/fasteai/schedulerAxios';

export const downloadReport = async (reportId: string): Promise<Blob> => {
    const response = await schedulerAxios.get(`/reports/${reportId}/download`, {
        responseType: 'blob',
    });
    return response.data;
};
