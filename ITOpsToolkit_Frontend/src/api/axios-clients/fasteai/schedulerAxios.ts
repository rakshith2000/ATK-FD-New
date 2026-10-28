import axios from 'axios';
import { appConfig } from '@/config/app-config';
import { getValidToken } from './fasteaiAuth';

export const SCHEDULER_BASE = appConfig.fasteai.schedulerBaseUrl;

const schedulerAxios = axios.create({ baseURL: SCHEDULER_BASE });

schedulerAxios.interceptors.request.use(async (config) => {
    const token = await getValidToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

schedulerAxios.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            sessionStorage.removeItem('fasteai_jwt_token');
            const token = await getValidToken();
            original.headers.Authorization = `Bearer ${token}`;
            return schedulerAxios(original);
        }
        return Promise.reject(error);
    },
);

export default schedulerAxios;
