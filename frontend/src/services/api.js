import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getContainers = async () => {
  const res = await api.get('/queries/containers');
  return res.data;
};

export const getContainerState = async (containerId) => {
  const res = await api.get(`/queries/containers/${containerId}`);
  return res.data;
};

export const getContainerEvents = async (containerId) => {
  const res = await api.get(`/queries/containers/${containerId}/events`);
  return res.data;
};

export const getContainerTimeline = async (containerId) => {
  const res = await api.get(`/queries/containers/${containerId}/timeline`);
  return res.data;
};

export const getHistoricalState = async (containerId, { timestamp, version }) => {
  const params = {};
  if (timestamp) params.timestamp = timestamp;
  if (version !== undefined && version !== null) params.version = version;

  const res = await api.get(`/queries/containers/${containerId}/state-at`, { params });
  return res.data;
};

export const getContainerMetrics = async (containerId) => {
  const res = await api.get(`/queries/containers/${containerId}/metrics`);
  return res.data;
};

export const getContainerIntegrity = async (containerId) => {
  const res = await api.get(`/queries/containers/${containerId}/integrity`);
  return res.data;
};

// Command endpoints
export const createContainer = async (payload) => {
  const res = await api.post('/commands/containers', payload);
  return res.data;
};

export const loadContainer = async (containerId, payload) => {
  const res = await api.post(`/commands/containers/${containerId}/load`, payload);
  return res.data;
};

export const moveContainer = async (containerId, payload) => {
  const res = await api.post(`/commands/containers/${containerId}/move`, payload);
  return res.data;
};

export const recordTemperature = async (containerId, payload) => {
  const res = await api.post(`/commands/containers/${containerId}/temperature`, payload);
  return res.data;
};

export const arriveContainer = async (containerId, payload) => {
  const res = await api.post(`/commands/containers/${containerId}/arrive`, payload);
  return res.data;
};

export const unloadContainer = async (containerId, payload) => {
  const res = await api.post(`/commands/containers/${containerId}/unload`, payload);
  return res.data;
};

export const completeDelivery = async (containerId, payload) => {
  const res = await api.post(`/commands/containers/${containerId}/complete`, payload);
  return res.data;
};

export default api;
