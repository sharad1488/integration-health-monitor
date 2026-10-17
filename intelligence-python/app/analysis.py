from __future__ import annotations

from datetime import datetime, timezone

from app.models import Anomaly, AdvisoryStatus, Evidence, Insight, MetricComparison

METRICS = ("request_volume", "error_rate", "average_latency_ms")


def analyze(evidence: Evidence, generated_at: datetime | None = None) -> Insight:
    generated_at = generated_at or datetime.now(timezone.utc)
    values = {"request_volume": float(evidence.current.request_volume),
              "error_rate": evidence.current.error_rate,
              "average_latency_ms": evidence.current.average_latency_ms}
    comparisons: dict[str, MetricComparison] = {}
    anomalies: list[Anomaly] = []
    evidence_lines: list[str] = []
    for metric in METRICS:
        current = values[metric]
        baseline = evidence.historical.get(metric)
        if baseline is None or baseline.sample_count < evidence.minimum_baseline_samples:
            comparisons[metric] = MetricComparison(current=current, historical_mean=None, absolute_change=None,
                percent_change=None, z_score=None, samples=baseline.sample_count if baseline else 0, anomalous=False)
            continue
        delta = current - baseline.mean
        percent = (delta / baseline.mean * 100) if baseline.mean else (0.0 if current == 0 else None)
        z_score = delta / baseline.standard_deviation if baseline.standard_deviation else (0.0 if delta == 0 else None)
        flagged = abs(z_score) >= evidence.z_score_threshold if z_score is not None else current != baseline.mean
        comparisons[metric] = MetricComparison(current=current, historical_mean=baseline.mean,
            absolute_change=delta, percent_change=percent, z_score=z_score,
            samples=baseline.sample_count, anomalous=flagged)
        if flagged:
            direction = "increased" if delta > 0 else "decreased"
            severity = "high" if z_score is None or abs(z_score) >= evidence.z_score_threshold * 2 else "moderate"
            detail = f"{metric} {direction} from historical mean {baseline.mean:g} to {current:g}"
            if z_score is not None:
                detail += f" ({z_score:+.1f} standard deviations)"
            anomalies.append(Anomaly(metric=metric, direction=direction, severity=severity, evidence=detail))
            evidence_lines.append(detail + ".")
    for code, count in sorted(evidence.error_code_counts.items(), key=lambda item: (-item[1], item[0]))[:3]:
        if count:
            evidence_lines.append(f"HTTP/error code {code}: {count} requests in the current window.")
    insufficient = not evidence.historical or all(c.samples < evidence.minimum_baseline_samples for c in comparisons.values())
    if insufficient:
        status = AdvisoryStatus.INSUFFICIENT_DATA
        summary = "Not enough historical samples to assess changes reliably."
        cause = "Historical comparison data is missing or below the configured minimum sample count."
        recommendations = ["Collect more historical windows before drawing conclusions."]
    elif anomalies:
        status = AdvisoryStatus.ANOMALY
        names = ", ".join(a.metric.replace("_", " ") for a in anomalies)
        summary = f"Statistical deviation detected in {names}."
        cause = _likely_cause(anomalies, evidence.error_code_counts)
        recommendations = _recommendations(anomalies, evidence.error_code_counts)
    else:
        status = AdvisoryStatus.NORMAL
        summary = "Current metrics are within the configured historical variation threshold."
        cause = "No statistically significant deviation was found in the supplied metrics."
        recommendations = ["Continue monitoring the next reporting window."]
    if not evidence.error_code_counts and evidence.current.request_volume == 0:
        evidence_lines.append("No requests were recorded in the current window.")
    elif not evidence_lines:
        evidence_lines.append("No supplied metric exceeded the configured anomaly threshold.")
    return Insight(integration_id=evidence.integration_id, generated_at=generated_at, status=status,
        summary=summary, likely_cause=cause, supporting_evidence=evidence_lines,
        recommendations=recommendations, anomalies=anomalies, comparisons=comparisons,
        error_code_counts=evidence.error_code_counts, authoritative_health_status=evidence.authoritative_health_status,
        demonstration_data=evidence.demonstration_data, llm_used=False)


def _likely_cause(anomalies: list[Anomaly], codes: dict[str, int]) -> str:
    if "error_rate" in {a.metric for a in anomalies} and codes:
        code = min(codes, key=lambda key: (-codes[key], key))
        return f"Elevated errors are the strongest signal; code {code} is the most frequent supplied error code."
    if "average_latency_ms" in {a.metric for a in anomalies}:
        return "Latency is outside its historical range; downstream slowness or a dependency capacity issue may be contributing."
    return "One or more supplied metrics are outside their historical range; inspect the affected integration and its dependency telemetry."


def _recommendations(anomalies: list[Anomaly], codes: dict[str, int]) -> list[str]:
    metrics = {a.metric for a in anomalies}
    suggestions: list[str] = []
    if "error_rate" in metrics:
        suggestions.append("Review recent failures and group them by the supplied error codes.")
    if "average_latency_ms" in metrics:
        suggestions.append("Compare dependency latency and timeout behavior over the same time window.")
    if "request_volume" in metrics:
        suggestions.append("Check whether the request volume change matches expected traffic or a retry burst.")
    if codes and "error_rate" in metrics:
        top = min(codes, key=lambda key: (-codes[key], key))
        suggestions.append(f"Inspect representative requests with error code {top}.")
    suggestions.append("Re-evaluate after the next observation window to confirm whether the deviation persists.")
    return suggestions
