import type { HealthResponse, IntegrationId, RequestLog, TrendsResponse } from '../types/dashboard';

// Use the same origin in development and in the Docker-served app.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error((await response.text()) || `Java API returned ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Java API request timed out after 8 seconds.');
    throw error;
  } finally { window.clearTimeout(timeout); }
}
export const dashboardApi = {
  health: () => request<HealthResponse>('/health'),
  logs: (integration: IntegrationId, limit = 100) => request<RequestLog[]>(`/integrations/${integration}/logs?limit=${limit}`),
  trends: (integration: IntegrationId) => request<TrendsResponse>(`/integrations/${integration}/trends`),
};
