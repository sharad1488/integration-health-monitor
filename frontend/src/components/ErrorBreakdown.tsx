import { Box, Paper, Typography } from '@mui/material';
import type { ErrorCode } from '../types/dashboard';
export function ErrorBreakdown({ items, integration }: { items: ErrorCode[]; integration: string }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const segments = total ? items.map((item, index) => { const before = items.slice(0, index).reduce((sum, entry) => sum + entry.count, 0); return `${item.color} ${before / total * 100}% ${(before + item.count) / total * 100}%`; }).join(',') : '#e8edf5 0% 100%';
  return <Paper className="panel breakdown-panel"><Typography variant="h6">Failure codes · {integration}</Typography>{total === 0 ? <div className="breakdown-empty">No failing responses in the current log set.</div> : <Box className="breakdown-content"><div className="donut" style={{ background: `conic-gradient(${segments})` }}><div className="donut-label"><strong>{total}</strong><span>Failures</span></div></div><div className="legend">{items.map(item => <div className="legend-row" key={item.code}><i style={{ background: item.color }}/><span>{item.code} {item.label}</span><strong>{item.count} ({Math.round(item.count / total * 100)}%)</strong></div>)}</div></Box>}</Paper>;
}
