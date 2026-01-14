import {configureApi} from '@integrator/api-client';

if (typeof import.meta.env.VITE_API_URL !== 'string') {
  throw new Error('VITE_API_URL not found in env');
}

export const API_URL = import.meta.env.VITE_API_URL;

configureApi({apiUrl: API_URL});
