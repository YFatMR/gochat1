import axios from 'axios';

export const API_HOST = `localhost:8010`;
export const API_URL = `http://localhost:8010`;

const $api = axios.create({
    withCredentials: true,
    // baseURL: API_URL,
})

$api.interceptors.request.use((config) => {
    config.headers.Authorization = `${localStorage.getItem('token')}`
    return config
})

export default $api;
