import type { IntegrationId, IntegrationInsight } from '../types/dashboard';

const API_BASE = (import.meta.env.VITE_INTELLIGENCE_API_BASE_URL || '/ai').replace(/\/$/, '');

export const insightApi = {
  getIntegrationInsight: async (integration: IntegrationId): Promise<IntegrationInsight> => {
    const response = await fetch(`${API_BASE}/integrations/${encodeURIComponent(integration)}/insights`);
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { detail?: string } | null;
      throw new Error(body?.detail || `Insight service returned ${response.status}.`);
    }
    return await response.json() as IntegrationInsight;
  },
};
