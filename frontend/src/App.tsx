import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { InsightsPanel } from './components/InsightsPanel';
import { IntegrationTable } from './components/IntegrationTable';
import { SummaryCard } from './components/SummaryCard';
import { TrendChart } from './components/TrendChart';
import { ErrorBreakdown } from './components/ErrorBreakdown';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { dashboardApi } from './api/dashboardApi';
import { integrationIds } from './types/dashboard';
import type { IntegrationId, IntegrationRow, RequestLog, SelectedTrends, TrendsResponse } from './types/dashboard';
import './App.css';

const metadata: Record<IntegrationId, { name: string; description: string }> = {
  PAYROLL: { name: 'PAYROLL', description: 'Payroll processing and sync' },
  ATS: { name: 'ATS', description: 'Applicant tracking system' },
  E_SIGN: { name: 'E_SIGN', description: 'Document signing' },
  DIRECTORY_SYNC: { name: 'DIRECTORY_SYNC', description: 'User directory synchronization' },
  NOTIFICATIONS: { name: 'NOTIFICATIONS', description: 'Email and SMS notifications' },
};
const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];
const isFailure = (status: number) => status >= 500 || status === 408 || status === 504;
const formatTime = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value)) : 'No successful request';
const toTrendPoints = (rows: Array<{ timestamp: string; value: number }>, percent = false) => {
  const buckets = new Map<string, number[]>();
  [...rows].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)).forEach(({ timestamp, value }) => {
    const key = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    buckets.set(key, [...(buckets.get(key) ?? []), value]);
  });
  return [...buckets.entries()].map(([time, values]) => ({ time, value: percent ? values.reduce((a, b) => a + b, 0) / values.length * 100 : values.reduce((a, b) => a + b, 0) / values.length }));
};
function normalizeTrends(data: TrendsResponse): SelectedTrends {
  const errorRate = toTrendPoints(data.errorRate.map(point => ({ timestamp: point.timestamp, value: point.failed })), true);
  const latency = toTrendPoints(data.latency.map(point => ({ timestamp: point.timestamp, value: point.latencyMs })));
  const labels: Record<string, string> = { '408': 'Request Timeout', '500': 'Internal Server Error', '502': 'Bad Gateway', '503': 'Service Unavailable', '504': 'Gateway Timeout' };
  const errorCodes = Object.entries(data.errorCodes).map(([code, count], index) => ({ code, label: labels[code] ?? 'Server Error', count, color: colors[index % colors.length] }));
  return { errorRate, latency, errorCodes };
}
const formatLatency = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;

export default function App() {
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [selectedId, setSelectedId] = useState<IntegrationId | null>(null);
  const [trends, setTrends] = useState<SelectedTrends | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState('');
  const [trendError, setTrendError] = useState('');
  const selected = rows.find(row => row.integration === selectedId) ?? null;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (rows.length === 0) setLoading(true);
    setApiError('');
    try {
      const health = await dashboardApi.health();
      const details = await Promise.all(health.integrations.map(async item => {
        const id = item.integration;
        let lastSuccess: string | null = null;
        try { lastSuccess = (await dashboardApi.logs(id, 100)).find(log => !isFailure(log.statusCode))?.timestamp ?? null; } catch { /* Health remains useful when logs are unavailable. */ }
        return { ...item, ...metadata[id], lastSuccess };
      }));
      const ordered = integrationIds.map(id => details.find(row => row.integration === id)).filter((row): row is IntegrationRow => Boolean(row));
      setRows(ordered);
      setUpdatedAt(health.generatedAt);
      setSelectedId(current => current && ordered.some(row => row.integration === current) ? current : (ordered.find(row => row.status === 'UNHEALTHY') ?? ordered[0])?.integration ?? null);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Could not connect to the Java health API.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [rows.length]);

  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!selectedId) { setTrends(null); setLogs([]); return; }
    let active = true;
    setTrendError('');
    setTrends(null);
    setLogs([]);
    dashboardApi.trends(selectedId).then(value => {
      if (active) setTrends(normalizeTrends(value));
    }).catch(error => {
      if (active) setTrendError(error instanceof Error ? error.message : 'Could not load trend data.');
    });
    dashboardApi.logs(selectedId, 5).then(value => {
      if (active) setLogs(value);
    }).catch(error => {
      if (active) setTrendError(error instanceof Error ? error.message : 'Could not load recent request logs.');
    });
    return () => { active = false; };
  }, [selectedId, updatedAt]);

  const counts = useMemo(() => rows.reduce((result, row) => { result.total += 1; result[row.status] += 1; return result; }, { total: 0, HEALTHY: 0, DEGRADED: 0, UNHEALTHY: 0, UNKNOWN: 0 }), [rows]);
  const onNavigate = (target: string) => document.getElementById(target)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  const status = selected?.status ?? 'UNKNOWN';

  return <div className="app-shell">
    <TopBar updatedAt={updatedAt} refreshing={refreshing} connected={!apiError && !loading} onRefresh={() => void refresh()} />
    <Sidebar onNavigate={onNavigate} />
    <main className="main-content" id="dashboard">
      <div className="page-intro"><div><Typography variant="h5">Integration Health Dashboard</Typography><p>Real-time status of HR and payroll integrations</p></div><div className="demo-pill"><span /> Seeded demonstration data</div></div>
      {apiError && <Alert severity="error" className="api-error" action={<Button color="inherit" size="small" onClick={() => void refresh()}>Retry</Button>}>Java backend unavailable: {apiError}</Alert>}
      {loading ? <div className="page-state" role="status"><CircularProgress /><span>Loading integration health from Java…</span></div> : rows.length === 0 ? <div className="page-state"><Typography variant="h6">No integrations returned</Typography><span>The Java API returned an empty integration list.</span></div> : <>
        <div className="dashboard-grid">
          <section className="overview-column">
            <div className="summary-grid">
              <SummaryCard label="Healthy" value={counts.HEALTHY} tone="green" />
              <SummaryCard label="Degraded" value={counts.DEGRADED} tone="amber" />
              <SummaryCard label="Unhealthy" value={counts.UNHEALTHY} tone="red" />
              <SummaryCard label="Total Integrations" value={counts.total} tone="blue" />
            </div>
            {counts.UNKNOWN > 0 && <div className="unknown-note">{counts.UNKNOWN} integration{counts.UNKNOWN === 1 ? '' : 's'} awaiting the minimum sample size</div>}
            <div id="integrations"><IntegrationTable rows={rows} selectedId={selectedId} onSelect={row => setSelectedId(row.integration)} /></div>
            {selected && <section className="detail-section" id="logs">
              <div className="detail-heading"><div><span className="detail-icon">▣</span><div><Typography variant="h6">{selected.name}</Typography><span>{selected.description}</span></div><span className={`status-chip ${status.toLowerCase()}`}>{status}</span></div><small>Current Java health window</small></div>
              <div className="detail-metrics">
                <Metric label="Requests in window" value={selected.requestVolume.toLocaleString()} />
                <Metric label="Error rate" value={`${(selected.errorRate * 100).toFixed(1)}%`} tone={selected.errorRate > 0.05 ? 'red' : undefined} />
                <Metric label="Average latency" value={formatLatency(selected.averageLatencyMs)} />
                <Metric label="Last success" value={formatTime(selected.lastSuccess)} />
              </div>
              <div className="recent-logs-heading"><Typography variant="subtitle1">Recent Logs</Typography><span>Latest 5 requests from Java</span></div>
              {logs.length === 0 ? <div className="logs-empty">No request logs are available for this integration.</div> : <div className="table-overflow"><Table size="small" aria-label={`Recent logs for ${selected.name}`} className="logs-table"><TableHead><TableRow><TableCell>Time</TableCell><TableCell>Status</TableCell><TableCell>Endpoint</TableCell><TableCell>Latency</TableCell><TableCell>Error</TableCell></TableRow></TableHead><TableBody>{logs.map(log => <TableRow key={log.requestId}><TableCell>{formatTime(log.timestamp)}</TableCell><TableCell><span className={`http-code ${isFailure(log.statusCode) ? 'failed' : 'success'}`}>{log.statusCode}</span></TableCell><TableCell>{log.path}</TableCell><TableCell>{formatLatency(log.latencyMs)}</TableCell><TableCell>{log.errorMessage ?? '—'}</TableCell></TableRow>)}</TableBody></Table></div>}
            </section>}
          </section>
          <InsightsPanel integrations={rows} selectedId={selectedId} />
          <section className="charts-grid" id="trends">
            {trendError && <Alert severity="warning" className="trend-error">Selected integration details are partially unavailable: {trendError}</Alert>}
            <TrendChart title={`Error rate · ${selected?.name ?? 'Integration'}`} data={trends?.errorRate ?? []} color="#ef4444" suffix="%" percent />
            <TrendChart title={`Latency · ${selected?.name ?? 'Integration'}`} data={trends?.latency ?? []} color="#f59e0b" suffix=" ms" />
            <ErrorBreakdown items={trends?.errorCodes ?? []} integration={selected?.name ?? 'Integration'} />
          </section>
        </div>
        <footer>Authoritative health status is calculated by Java · All displayed records are seeded demonstration data</footer>
      </>}
    </main>
  </div>;
}
function Metric({ label, value, tone }: { label: string; value: string; tone?: 'red' }) { return <div className="metric-card"><span>{label}</span><strong className={tone === 'red' ? 'danger-text' : ''}>{value}</strong><small>Java health API</small></div>; }



