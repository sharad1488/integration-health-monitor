import AutoAwesome from '@mui/icons-material/AutoAwesome';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import WarningAmber from '@mui/icons-material/WarningAmber';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import type { IntegrationId, IntegrationRow } from '../types/dashboard';

const label = (id: IntegrationId) => id.replace(/_/g, ' ');
function FindingCard({ integration }: { integration: IntegrationRow }) {
  const unhealthy = integration.status === 'UNHEALTHY';
  const degraded = integration.status === 'DEGRADED';
  const unknown = integration.status === 'UNKNOWN';
  const title = unknown ? `${integration.name} has limited data` : `${integration.name} integration is ${integration.status.toLowerCase()}`;
  const description = unknown
    ? `Only ${integration.requestVolume} requests are available in the current health window; Java has not met its minimum sample size.`
    : `Error rate is ${(integration.errorRate * 100).toFixed(1)}% across ${integration.requestVolume.toLocaleString()} requests, with ${integration.failureCount} failures. Average latency is ${integration.averageLatencyMs >= 1000 ? `${(integration.averageLatencyMs / 1000).toFixed(1)}s` : `${Math.round(integration.averageLatencyMs)}ms`}.`;
  const checks = unknown
    ? ['Wait for enough traffic to calculate a reliable health status.', 'Review request logs when samples are available.']
    : ['Review recent failed request logs and response codes.', 'Compare upstream response times for the same window.', 'Recheck the Java-calculated status after the next observation window.'];
  return <article className={`finding-card ${unhealthy ? 'finding-danger' : degraded ? 'finding-warning' : 'finding-neutral'}`}>
    <div className="finding-heading"><span className={`finding-icon ${unhealthy ? 'unhealthy' : degraded ? 'degraded' : 'unknown'}`}>{unhealthy ? <ErrorIcon /> : degraded ? <WarningAmber /> : <LightbulbOutlined />}</span><strong>{title}</strong></div>
    <p>{description}</p>
    <h4>What to investigate</h4>
    <ul>{checks.map(check => <li key={check}>{check}</li>)}</ul>
    <small>Suggested checks only · Java remains authoritative</small>
  </article>;
}

export function InsightsPanel({ integrations, selectedId }: { integrations: IntegrationRow[]; selectedId: IntegrationId | null }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const findings = useMemo(() => integrations.filter(item => item.status === 'UNHEALTHY' || item.status === 'DEGRADED' || item.status === 'UNKNOWN'), [integrations]);
  const selected = integrations.find(item => item.integration === selectedId) ?? findings[0] ?? integrations[0] ?? null;
  useEffect(() => setAnswer(''), [selectedId]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim() || !selected) return;
    const query = question.toLowerCase();
    if (query.includes('yesterday') || query.includes('compare')) {
      setAnswer('Historical day-over-day comparison is not available in the current Java dashboard API. This panel uses only the current health window.');
    } else if (query.includes('trend')) {
      setAnswer(`Open the trends section for ${selected.name} to review its error-rate, latency, and failure-code charts.`);
    } else {
      setAnswer(`${selected.name}: Java reports ${selected.status.toLowerCase()} status, ${(selected.errorRate * 100).toFixed(1)}% errors across ${selected.requestVolume.toLocaleString()} requests, and ${Math.round(selected.averageLatencyMs)} ms average latency. Review recent logs and upstream response codes for more detail.`);
    }
  };

  const handleChip = (prompt: string) => {
    setQuestion(prompt);
    if (!selected) return;
    setAnswer(prompt.includes('compare')
      ? 'Historical day-over-day comparison is not available in the current Java dashboard API.'
      : prompt.includes('trend')
        ? `Open the trends section for ${selected.name} to review the available metric charts.`
        : `${selected.name}: ${(selected.errorRate * 100).toFixed(1)}% error rate, ${selected.failureCount} failed requests, and ${Math.round(selected.averageLatencyMs)} ms average latency in the current Java health window.`);
  };
  return <Paper className="panel insight-panel" id="insights">
    <Box className="insight-title"><AutoAwesome /><div><Typography variant="h6">AI Intelligence</Typography><span>Evidence-based insights and suggested checks</span></div><Chip label="Advisory" size="small" color="primary" /></Box>
    <div className="attention-banner"><LightbulbOutlined/><strong>{findings.length ? `${findings.length} integration${findings.length === 1 ? '' : 's'} need attention` : 'No integrations need attention'}</strong></div>
    <div className="finding-list">{findings.length ? findings.map(item => <FindingCard key={item.integration} integration={item}/>) : <div className="stable-card"><CheckCircle/><div><strong>Overall system is stable</strong><p>All ${integrations.length} integrations are healthy in the current Java health window.</p></div></div>}</div>
    <div className="insight-disclaimer">These are rule-based observations from Java metrics. The Python LLM service is not connected to this screen yet.</div>
    <form className="insight-question" onSubmit={submit}><label htmlFor="insight-question">Ask about the current integration data</label><div className="question-input"><input id="insight-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask about error rates, latency, or trends…" /><button type="submit" aria-label="Ask question">➤</button></div></form>
    <div className="prompt-chips"><button type="button" onClick={() => handleChip('Why is payroll failing?')}>Why is {label(selected?.integration ?? 'PAYROLL')} failing?</button><button type="button" onClick={() => handleChip('How does today compare to yesterday?')}>Compare with yesterday</button><button type="button" onClick={() => handleChip('Show error trends')}>Show error trends</button></div>
    {answer && <div className="question-answer" role="status"><strong>Based on current Java data</strong><p>{answer}</p></div>}
  </Paper>;
}


