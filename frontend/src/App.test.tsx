import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { HealthResponse, RequestLog, TrendsResponse } from './types/dashboard';

const api = vi.hoisted(() => ({ health: vi.fn(), logs: vi.fn(), trends: vi.fn() }));
vi.mock('./api/dashboardApi', () => ({ dashboardApi: api }));

const health: HealthResponse = {
  generatedAt: '2026-10-17T10:15:00Z',
  demonstrationData: true,
  integrations: [
    { integration: 'PAYROLL', status: 'UNHEALTHY', healthScore: 81, errorRate: .185, averageLatencyMs: 4200, requestVolume: 1240, failureCount: 230, consecutiveFailures: 3, generatedAt: '2026-10-17T10:15:00Z', lastUpdated: '2026-10-17T10:02:00Z', demonstrationData: true },
    { integration: 'ATS', status: 'DEGRADED', healthScore: 95, errorRate: .052, averageLatencyMs: 1800, requestVolume: 320, failureCount: 17, consecutiveFailures: 0, generatedAt: '2026-10-17T10:15:00Z', lastUpdated: '2026-10-17T10:14:00Z', demonstrationData: true },
    { integration: 'E_SIGN', status: 'HEALTHY', healthScore: 100, errorRate: .003, averageLatencyMs: 620, requestVolume: 140, failureCount: 1, consecutiveFailures: 0, generatedAt: '2026-10-17T10:15:00Z', lastUpdated: '2026-10-17T10:15:00Z', demonstrationData: true },
    { integration: 'DIRECTORY_SYNC', status: 'HEALTHY', healthScore: 100, errorRate: .001, averageLatencyMs: 450, requestVolume: 200, failureCount: 0, consecutiveFailures: 0, generatedAt: '2026-10-17T10:15:00Z', lastUpdated: '2026-10-17T10:15:00Z', demonstrationData: true },
    { integration: 'NOTIFICATIONS', status: 'HEALTHY', healthScore: 100, errorRate: .004, averageLatencyMs: 780, requestVolume: 500, failureCount: 2, consecutiveFailures: 0, generatedAt: '2026-10-17T10:15:00Z', lastUpdated: '2026-10-17T10:15:00Z', demonstrationData: true },
  ],
};
const logs: RequestLog[] = [
  { integration: 'PAYROLL', requestId: 'req-1', timestamp: '2026-10-17T10:02:00Z', method: 'POST', path: '/payroll/process', statusCode: 504, latencyMs: 4200, errorMessage: 'GATEWAY_TIMEOUT' },
  { integration: 'PAYROLL', requestId: 'req-2', timestamp: '2026-10-17T10:01:45Z', method: 'POST', path: '/payroll/calculate', statusCode: 500, latencyMs: 3800, errorMessage: 'INTERNAL_ERROR' },
];
const trends: TrendsResponse = { integration: 'PAYROLL', errorRate: [{ timestamp: '2026-10-17T10:00:00Z', failed: 1 }], latency: [{ timestamp: '2026-10-17T10:00:00Z', latencyMs: 4200 }], errorCodes: { '504': 1, '500': 1 } };

beforeEach(() => {
  vi.clearAllMocks();
  api.health.mockResolvedValue(health);
  api.logs.mockResolvedValue(logs);
  api.trends.mockResolvedValue(trends);
});

describe('Integration Health dashboard', () => {
  it('loads summary, integration rows, selected logs, and evidence-based findings', async () => {
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent(/Loading integration health/);
    expect(await screen.findByText('Total Integrations')).toBeInTheDocument();
    expect(screen.getByText('Seeded demonstration data')).toBeInTheDocument();
    expect(screen.getByText('2 integrations need attention')).toBeInTheDocument();
    expect(screen.getByText(/PAYROLL integration is unhealthy/i)).toBeInTheDocument();
    expect(screen.getByText(/ATS integration is degraded/i)).toBeInTheDocument();
    expect(await screen.findByText('GATEWAY_TIMEOUT')).toBeInTheDocument();
    expect(screen.getByText('Latest 5 requests from Java')).toBeInTheDocument();
  });

  it('filters integrations and updates the selected detail row', async () => {
    render(<App />);
    await screen.findByText('Total Integrations');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search integrations' }), { target: { value: 'ATS' } });
    expect(screen.getByText('Applicant tracking system')).toBeInTheDocument();
    expect(screen.queryByText('E_SIGN')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.getAllByText('ATS').length).toBeGreaterThan(1);
  });

  it('shows an empty result when the integration search has no matches', async () => {
    render(<App />);
    await screen.findByText('Total Integrations');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search integrations' }), { target: { value: 'no-such-integration' } });
    expect(screen.getByText(/No integrations match/)).toBeInTheDocument();
  });

  it('shows backend errors and retries successfully', async () => {
    api.health.mockRejectedValueOnce(new Error('service unavailable')).mockResolvedValueOnce(health);
    render(<App />);
    expect(await screen.findByText(/Java backend unavailable/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Total Integrations')).toBeInTheDocument();
    await waitFor(() => expect(api.health).toHaveBeenCalledTimes(2));
  });

  it('shows the API empty state when Java returns no integrations', async () => {
    api.health.mockResolvedValue({ ...health, integrations: [] });
    render(<App />);
    expect(await screen.findByText('No integrations returned')).toBeInTheDocument();
  });

  it('answers prompt chips using only current Java data and discloses unavailable history', async () => {
    render(<App />);
    await screen.findByText('Total Integrations');
    fireEvent.click(screen.getByRole('button', { name: 'Compare with yesterday' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Historical day-over-day comparison is not available/);
  });
});


