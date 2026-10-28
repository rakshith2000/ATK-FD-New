import axios from 'axios';
import { FASTEAI_SOP_BASE, getValidToken } from './fasteaiAuth';

const fasteaiAxios = axios.create({
    baseURL: FASTEAI_SOP_BASE,
});

fasteaiAxios.interceptors.request.use(async (config) => {
    const token = await getValidToken();
    config.headers = {
        ...((config.headers as Record<string, string>) || {}),
        Authorization: `Bearer ${token}`,
    } as typeof config.headers;
    return config;
});

fasteaiAxios.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const token = await getValidToken();
                original.headers = {
                    ...((original.headers as Record<string, string>) || {}),
                    Authorization: `Bearer ${token}`,
                } as typeof original.headers;
                return fasteaiAxios(original);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default fasteaiAxios;
