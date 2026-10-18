import AutoAwesome from '@mui/icons-material/AutoAwesome';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { insightApi } from '../api/insightApi';
import { integrationIds } from '../types/dashboard';
import type { IntegrationId, IntegrationInsight, IntegrationRow } from '../types/dashboard';

const normalizeIntegration = (value: string): IntegrationId | null => {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return integrationIds.find(integration => integration === normalized) ?? null;
};

function JavaInsight({ integration }: { integration: IntegrationRow }) {
  const unhealthy = integration.status === 'UNHEALTHY';
  const degraded = integration.status === 'DEGRADED';
  const unknown = integration.status === 'UNKNOWN';
  const title = unknown ? `${integration.name} has limited data` : `${integration.name} integration is ${integration.status.toLowerCase()}`;
  const summary = unknown
    ? `Java has ${integration.requestVolume.toLocaleString()} requests in the current health window, which is not enough to assess reliability.`
    : `Java reports ${(integration.errorRate * 100).toFixed(1)}% errors across ${integration.requestVolume.toLocaleString()} requests, with ${integration.failureCount} failures and ${integration.averageLatencyMs >= 1000 ? `${(integration.averageLatencyMs / 1000).toFixed(1)}s` : `${Math.round(integration.averageLatencyMs)}ms`} average latency.`;
  const checks = unknown
    ? ['Wait for enough traffic to calculate a reliable health status.', 'Review request logs when samples are available.']
    : unhealthy || degraded
      ? ['Review recent failed request logs and response codes.', 'Compare upstream response times for the same window.', 'Recheck the Java-calculated status after the next observation window.']
      : ['Continue monitoring the current health window.', 'Review recent request logs if the integration behavior changes.'];
  return <article className={`finding-card ${unhealthy ? 'finding-danger' : degraded ? 'finding-warning' : 'finding-neutral'}`}>
    <div className="finding-heading"><strong>{title}</strong><Chip label={integration.status} size="small" /></div>
    <p>{summary}</p>
    <h4>Suggested checks</h4>
    <ul>{checks.map(check => <li key={check}>{check}</li>)}</ul>
    <small>Java health metrics · advisory only</small>
  </article>;
}

export function InsightsPanel({ selected }: { selected: IntegrationRow | null }) {
  const selectedId = selected?.integration ?? null;
  const [integrationName, setIntegrationName] = useState(selectedId ?? '');
  const [insight, setInsight] = useState<IntegrationInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    requestId.current += 1;
    setIntegrationName(selectedId ?? '');
    setInsight(null);
    setError('');
    setLoading(false);
  }, [selectedId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const integration = normalizeIntegration(integrationName);
    setInsight(null);
    if (!integration) {
      requestId.current += 1;
      setLoading(false);
      setError(`Enter a supported integration: ${integrationIds.join(', ')}.`);
      return;
    }

    const currentRequest = ++requestId.current;
    setIntegrationName(integration);
    setLoading(true);
    setError('');
    try {
      const result = await insightApi.getIntegrationInsight(integration);
      if (requestId.current === currentRequest) {
        if (result.integrationName.toUpperCase() !== integration) {
          throw new Error('The insight service returned a different integration.');
        }
        setInsight(result);
      }
    } catch (requestError) {
      if (requestId.current === currentRequest) {
        setError(requestError instanceof Error ? requestError.message : 'Could not load integration insights.');
      }
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  };

  return <Paper className="panel insight-panel" id="insights">
    <Box className="insight-title"><AutoAwesome /><div><Typography variant="h6">AI Intelligence</Typography><span>{insight ? 'OpenAI analysis grounded in Java health metrics' : 'Java health insight · ask AI for deeper analysis'}</span></div><Chip label={insight ? 'Python AI' : 'Java advisory'} size="small" color="primary" /></Box>
    {insight ? <section className="ai-insight-result" aria-label={`${insight.integrationName} AI insight`}>
      <div className="ai-insight-heading"><div><span className="insight-eyebrow">Integration insight</span><Typography variant="h6">{insight.integrationName}</Typography></div><Chip label={insight.assessment} size="small" className={`assessment-chip assessment-${insight.assessment.toLowerCase()}`} /></div>
      <p className="ai-insight-summary">{insight.summary}</p>
      {insight.keyFindings.length > 0 && <div className="ai-insight-section"><h4>Key findings</h4><ul>{insight.keyFindings.map((finding, index) => <li key={`${index}-${finding}`}>{finding}</li>)}</ul></div>}
      {insight.possibleCauses.length > 0 && <div className="ai-insight-section"><h4>Possible causes</h4><ul>{insight.possibleCauses.map((cause, index) => <li key={`${index}-${cause.cause}`}><strong>{cause.cause}</strong><span>{cause.evidence}</span><Chip label={`${cause.confidence} confidence`} size="small" /></li>)}</ul></div>}
      {insight.recommendedActions.length > 0 && <div className="ai-insight-section"><h4>Recommended actions</h4><ul>{insight.recommendedActions.map((item, index) => <li key={`${index}-${item.action}`}><Chip label={`${item.priority} priority`} size="small" />{item.action}</li>)}</ul></div>}
      {insight.dataLimitations.length > 0 && <div className="ai-insight-section insight-limitations"><h4>Data limitations</h4><ul>{insight.dataLimitations.map((limitation, index) => <li key={`${index}-${limitation}`}>{limitation}</li>)}</ul></div>}
      <small className="insight-disclaimer">Advisory analysis based on Java health metrics. Java remains authoritative for integration status.</small>
    </section> : selected ? <JavaInsight integration={selected} /> : <div className="insight-message">Select an integration to view its Java health insight.</div>}
    <form className="insight-question" onSubmit={event => void submit(event)}>
      <label htmlFor="insight-question">Ask AI about an integration</label>
      <div className="question-input"><input id="insight-question" value={integrationName} onChange={event => setIntegrationName(event.target.value)} placeholder="PAYROLL, ATS, E_SIGN…" aria-describedby="integration-name-help" /><button type="submit" aria-label="Get integration insight" disabled={loading}>➤</button></div>
      <small id="integration-name-help" className="insight-help">Supported: {integrationIds.join(', ')}</small>
    </form>
    {loading && <div className="insight-message" role="status">Fetching Java health metrics and generating AI insight…</div>}
    {error && <div className="insight-message insight-error" role="alert">{error}</div>}
  </Paper>;
}


