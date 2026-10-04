---
title: "A Practical Take on SLIs, SLOs, and Error Budgets"
date: 2026-01-02
description: "Cutting through the corporate jargon: what SLIs and SLOs actually mean in practice, with real Prometheus queries and burn rates."
tags: ["SRE", "Observability", "Prometheus"]
draft: false
---

When I first started reading SRE material, terms like SLI, SLO, and Error Budget felt like corporate buzzwords meant for giant companies with dedicated ops teams. 

Once I actually had to set up monitoring for my own services, the practical intuition clicked: **stop alerting on server feelings (like CPU reaching 85%), and start alerting on user pain (like failed requests or high latency).**

Here is my mental model and how to wire it up with Prometheus.

---

## The Jargon, Translated

It really just comes down to three things:

- **SLI (Service Level Indicator)**: The raw metric showing how things are running right now.  
  *Example:* What percentage of requests in the last 5 minutes succeeded without a 5xx error?
- **SLO (Service Level Objective)**: The target line you commit to over a longer window (usually 30 days).  
  *Example:* 99.9% of requests over the last 30 days should be successful.
- **Error Budget**: The room for failure you have left before breaking your promise.  
  If your SLO is 99.9%, your error budget is 0.1%. Over a 30-day window ($30 \times 24 \times 60$ minutes), 0.1% means roughly **43 minutes** of total downtime or bad requests.

The practical rule for error budgets: as long as you have budget left, push code and ship features. When the budget is burning fast, pause new releases and fix what's breaking.

---

## What Actually Needs Measuring

For most HTTP services, you only need two core metrics to know if things are bad:

### 1. Availability (Error Rate)

Are requests succeeding?

```promql
# Ratio of non-5xx requests to total requests over 5 minutes
sum(rate(http_requests_total{status!~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

> **Why filter out 4xx errors?**  
> If a client sends an invalid password, a malformed JSON body, or hits a 404 URL, that is client-side behavior, not your service being broken. Only 5xx errors mean the server failed.

### 2. Latency (p99)

Is the service fast enough for real humans? Averages lie: if 99 requests take 20ms and 1 request takes 10 seconds, the average looks fine, but that 1 user had a broken experience.

```promql
# 99th percentile response time
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

---

## Why Burn Rate Alerting Beats Simple Thresholds

This was the biggest "aha" moment for me.

If you write a basic alert like `alert if error_rate > 1%`:
- **Low traffic trap:** At 3 AM with only 4 total requests, a single network timeout means a 25% error rate. Your phone goes off for a blip that affected one person.
- **High traffic trap:** During peak hours, a steady 0.5% error rate might silently drain your entire monthly budget over 3 days, but you never get paged because it never crossed 1%.

**Burn rate** fixes this by asking: *"At the rate we are failing right now, how fast will we burn through our entire month's budget?"*

- **1x burn rate**: Budget runs out in exactly 30 days (normal background noise).
- **14.4x burn rate**: Budget will be completely wiped out in **2 hours**. This is a major fire $\rightarrow$ page immediately.
- **6x burn rate**: Budget will be wiped out in **5 days**. Not an emergency right now, but warrants a ticket and a look in the morning.

In Prometheus, alerting on a fast burn rate looks like this:

```yaml
- alert: APIHighBurnRateCritical
  expr: |
    (
      sum(rate(http_requests_total{status=~"5.."}[5m]))
      /
      sum(rate(http_requests_total[5m]))
    ) > (1 - 0.999) * 14.4
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "API is burning monthly error budget at >14x rate"
```

---

## Lessons Learned

1. **Don't chase four nines (99.99%) for fun**: Four nines means only 4.3 minutes of downtime per month. Unless you run multi-region active-active clusters with automated failover, you cannot deliver that. Be honest and pick 99.5% or 99.9%.
2. **Alert on symptoms, debug with causes**: Alert when requests fail or drag (SLIs). Only look at CPU, memory, and disk I/O when you are diagnosing *why* the SLI dropped.
3. **Watch histogram label cardinality**: Don't put user IDs or raw URLs with query params into metric labels. High cardinality will consume Prometheus RAM fast.
