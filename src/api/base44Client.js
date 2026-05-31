import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
export const dataBackend = import.meta.env.VITE_DATA_BACKEND || 'base44';

function adminAuthHeader() {
  try {
    const t = localStorage.getItem('qj_admin_token');
    return t ? { 'x-admin-token': t } : {};
  } catch {
    return {};
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...adminAuthHeader(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function createNeonEntityClient(entityName) {
  const endpoint = `/api/entities/${entityName}`;
  return {
    list: (order, limit) => {
      const params = new URLSearchParams();
      if (order) params.set('order', order);
      if (limit) params.set('limit', String(limit));
      return requestJson(`${endpoint}?${params.toString()}`);
    },
    filter: (filters = {}, order, limit) => {
      const params = new URLSearchParams();
      params.set('filters', JSON.stringify(filters));
      if (order) params.set('order', order);
      if (limit) params.set('limit', String(limit));
      return requestJson(`${endpoint}?${params.toString()}`);
    },
    create: (payload) => requestJson(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    update: (id, payload) => requestJson(`${endpoint}?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
    delete: (id) => requestJson(`${endpoint}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  };
}

function createNeonClient() {
  const entityNames = [
    'Article',
    'RawNewsFeed',
    'NewsSource',
    'MarketSnapshot',
    'NewsletterSubscriber',
    'SystemLog',
    'AssetPage',
    'ChatConversation',
  ];

  return {
    entities: Object.fromEntries(entityNames.map((name) => [name, createNeonEntityClient(name)])),
    functions: {
      invoke: async (name, payload = {}) => ({
        data: await requestJson(`/api/functions/${name}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      }),
    },
    integrations: {
      Core: {
        InvokeLLM: async (payload) => {
          const data = await requestJson('/api/ai/invoke', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          return Object.prototype.hasOwnProperty.call(data, 'result') ? data.result : data;
        },
        SendEmail: async () => {
          throw new Error('SendEmail is not implemented in the Neon/Vercel runtime yet.');
        },
      },
    },
    auth: {
      me: async () => ({ id: 'local-admin', role: 'admin', email: 'admin@quantjournal.local' }),
      loginViaEmailPassword: async () => ({ success: true }),
      loginWithProvider: () => { window.location.href = '/'; },
      register: async () => ({ success: true }),
      verifyOtp: async () => ({ access_token: 'local-admin' }),
      setToken: () => {},
      resendOtp: async () => ({ success: true }),
      resetPasswordRequest: async () => ({ success: true }),
      resetPassword: async () => ({ success: true }),
      logout: () => {},
      redirectToLogin: () => { window.location.href = '/login'; },
    },
  };
}

//Create a client with authentication required
export const base44 = dataBackend === 'neon' ? createNeonClient() : createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});
