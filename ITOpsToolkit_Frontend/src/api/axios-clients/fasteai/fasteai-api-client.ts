import axios from 'axios';
import { FASTEAI_SOP_BASE, getValidToken } from './fasteaiAuth';

const fasteaiApiClient = axios.create({
    baseURL: FASTEAI_SOP_BASE,
});

fasteaiApiClient.interceptors.request.use(async (config) => {
    const token = await getValidToken(FASTEAI_SOP_BASE);
    config.headers = {
        ...((config.headers as Record<string, string>) || {}),
        Authorization: `Bearer ${token}`,
    } as typeof config.headers;
    return config;
});

fasteaiApiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const token = await getValidToken(FASTEAI_SOP_BASE);
                original.headers = {
                    ...((original.headers as Record<string, string>) || {}),
                    Authorization: `Bearer ${token}`,
                } as typeof original.headers;
                return fasteaiApiClient(original);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default fasteaiApiClient;
