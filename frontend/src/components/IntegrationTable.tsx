import { useState } from 'react';
import { Button, Chip, LinearProgress, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { IntegrationId, IntegrationRow } from '../types/dashboard';
interface Props { rows: IntegrationRow[]; selectedId: IntegrationId | null; onSelect: (row: IntegrationRow) => void; }
const percent = (rate: number) => `${(rate * 100).toFixed(1)}%`;
const latency = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
const time = (value: string) => value ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—';
export function IntegrationTable({ rows, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const filtered = rows.filter(row => row.name.toLowerCase().includes(query.toLowerCase()));
  return <Paper className="panel table-panel"><div className="table-heading"><div><Typography variant="h6">Integrations</Typography><span className="section-subtitle">Authoritative status calculated by Java</span></div><div><input className="table-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search integrations" aria-label="Search integrations" />{query && <button className="view-all" onClick={() => setQuery('')}>Clear</button>}</div></div>
    <div className="table-overflow"><Table size="small" aria-label="Integration health"><TableHead><TableRow>{['Name', 'Status', 'Health score', 'Error rate', 'Avg latency', 'Requests', 'Last success', ''].map(title => <TableCell key={title}>{title}</TableCell>)}</TableRow></TableHead><TableBody>
      {filtered.map(row => <TableRow key={row.integration} hover selected={row.integration === selectedId} onClick={() => onSelect(row)} className="integration-row">
        <TableCell><div className="integration-cell"><span className="integration-symbol">{row.integration === 'PAYROLL' ? '▣' : row.integration === 'ATS' ? '♙' : row.integration === 'E_SIGN' ? '▤' : row.integration === 'DIRECTORY_SYNC' ? '◉' : '♧'}</span><span><strong>{row.name}</strong><small>{row.description}</small></span></div></TableCell>
        <TableCell><Chip className={`status-chip ${row.status.toLowerCase()}`} label={row.status} size="small" /></TableCell>
        <TableCell><div className="score-cell"><strong>{Math.round(row.healthScore)}</strong><LinearProgress className={`score-progress ${row.status.toLowerCase()}`} variant="determinate" value={Math.max(0, Math.min(100, row.healthScore))} /></div></TableCell>
        <TableCell className={row.errorRate >= .2 ? 'danger-text' : row.errorRate >= .05 ? 'warning-text' : ''}>{percent(row.errorRate)}</TableCell><TableCell>{latency(row.averageLatencyMs)}</TableCell><TableCell>{row.requestVolume.toLocaleString()}</TableCell>
        <TableCell><strong>{time(row.lastSuccess ?? '')}</strong><small className="table-subline">{row.lastSuccess ? 'Last successful request' : 'No successful request'}</small></TableCell>
        <TableCell><Button variant="outlined" size="small" onClick={event => { event.stopPropagation(); onSelect(row); }}>View</Button></TableCell>
      </TableRow>)}
    </TableBody></Table>{filtered.length === 0 && <div className="empty-table">No integrations match “{query}”.</div>}</div>
  </Paper>;
}
