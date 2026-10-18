export const integrationIds = ['PAYROLL', 'ATS', 'E_SIGN', 'DIRECTORY_SYNC', 'NOTIFICATIONS'] as const;
export type IntegrationId = (typeof integrationIds)[number];
export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
export interface BackendHealth {
  integration: IntegrationId; status: HealthStatus; healthScore: number; errorRate: number;
  averageLatencyMs: number; requestVolume: number; failureCount: number; consecutiveFailures: number;
  generatedAt: string; lastUpdated: string; demonstrationData: boolean;
}
export interface HealthResponse { generatedAt: string; demonstrationData: boolean; integrations: BackendHealth[]; }
export interface RequestLog { integration: IntegrationId; requestId: string; timestamp: string; method: string; path: string; statusCode: number; latencyMs: number; errorMessage: string | null; }
export interface TrendsResponse { integration: IntegrationId; errorRate: Array<{ timestamp: string; failed: number }>; latency: Array<{ timestamp: string; latencyMs: number }>; errorCodes: Record<string, number>; }
export interface IntegrationRow extends BackendHealth { name: string; description: string; lastSuccess: string | null; }
export interface ChartPoint { time: string; value: number; }
export interface SelectedTrends { errorRate: ChartPoint[]; latency: ChartPoint[]; errorCodes: Array<{ code: string; label: string; count: number; color: string }>; }

export interface ErrorCode { code: string; label: string; count: number; color: string; }
export interface IntegrationInsight {
  integrationName: string;
  assessment: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  summary: string;
  keyFindings: string[];
  possibleCauses: Array<{ cause: string; evidence: string; confidence: 'LOW' | 'MEDIUM' | 'HIGH' }>;
  recommendedActions: Array<{ priority: 'HIGH' | 'MEDIUM' | 'LOW'; action: string }>;
  dataLimitations: string[];
}
