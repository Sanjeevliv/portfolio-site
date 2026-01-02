---
title: "Implementing SLIs and SLOs: A Practical Guide"
date: 2026-01-02
draft: false
---

When I set out to build this SRE portfolio, I knew that simply creating a working application wasn't enough. What separates a hobbyist project from production-grade SRE work is the ability to *measure* and *guarantee* reliability. That's where Service Level Indicators (SLIs) and Service Level Objectives (SLOs) come in.

In this post, I'll share my journey of implementing SLIs and SLOs for my platform, the challenges I faced, and practical lessons learned along the way.

## Why SLIs and SLOs Matter

Before diving into implementation, let's address the fundamental question: **Why bother with SLIs and SLOs?**

Early in my career, I learned that "the application is running" is not a meaningful measure of success. What matters is:
- Are users actually able to use the service?
- How fast are their requests being processed?
- When something breaks, how long do we have to fix it?

SLIs and SLOs provide objective, quantifiable answers to these questions. More importantly, they create a shared language between engineering, product, and business teams about what "reliable enough" means.

## Understanding the Fundamentals

Here's how I think about the SLI/SLO hierarchy:

### Service Level Indicator (SLI)
A **quantitative measurement** of a specific aspect of service quality. Think of it as your speedometer—it tells you what's happening *right now*.

### Service Level Objective (SLO)
A **target range or threshold** for an SLI. This is your speed limit—the goal you're trying to maintain.

### Error Budget
The **inverse of your SLO**. If your SLO is 99.9% availability, your error budget is 0.1%—meaning you can afford 43.2 minutes of downtime per month.

## My Implementation Journey

### Step 1: Identifying What to Measure

The first challenge was deciding *what* to measure. I started by asking: "What do my users care about?"

For my API service, the answer was clear:
1. **Can they reach the service?** → Availability
2. **How fast does it respond?** → Latency

For my worker service (background job processor):
3. **Are jobs completing successfully?** → Success Rate

I deliberately kept it simple. It's tempting to measure everything, but that leads to alert fatigue and diluted focus.

### Step 2: Defining the SLIs

Here's how I translated those user concerns into concrete SLIs:

#### SLI #1: API Availability

**Definition**: The percentage of successful HTTP requests (non-5xx responses).

```
SLI = (total_requests - 5xx_errors) / total_requests × 100
```

**Why this metric?** A 5xx error means *I* broke something (server error), not the user. 4xx errors (bad requests) are excluded because they reflect client mistakes, not service unavailability.

**Prometheus Query**:

```promql
sum(rate(api_http_request_duration_seconds_count{status!~"5.."}[5m]))
/
sum(rate(api_http_request_duration_seconds_count[5m]))
```

#### SLI #2: API Latency (p99)

**Definition**: 99th percentile response time for all API requests.

**Why p99?** The median (p50) hides outliers. The worst-case user might be the most important customer. I chose p99 as a balance—p95 was too lenient, p99.9 was too strict for my traffic volume.

**Prometheus Query**:

```promql
histogram_quantile(0.99,
  sum(rate(api_http_request_duration_seconds_bucket[5m])) by (le)
)
```

#### SLI #3: Worker Job Success Rate

**Definition**: The percentage of background jobs completed without errors.

```
SLI = successful_jobs / total_jobs × 100
```

**Prometheus Query**:

```promql
sum(rate(worker_service_jobs_processed_total[5m]))
/
(sum(rate(worker_service_jobs_processed_total[5m])) + sum(rate(worker_service_jobs_failed_total[5m])))
```

### Step 3: Setting Realistic SLO Targets

This was the hardest part. How do I know if 99.9% is achievable? What about 99.95%?

Here's my approach:

| Service | SLI | SLO Target | Rationale |
|---------|-----|------------|-----------|
| API Service | Availability | **99.9%** | Allows 43.2 minutes downtime/month. Realistic for a single-zone deployment with no redundancy yet. |
| API Service | Latency (p99) | **< 300ms** | My application logic is fast (<10ms), but network + database adds overhead. 300ms feels responsive to users. |
| Worker Service | Job Success Rate | **99.5%** | Slightly lower than API because jobs can be retried. Some failures are acceptable (e.g., transient Redis connection issues). |

**Key Insight**: I based these targets on historical data from my local testing and the reality of my infrastructure constraints. Starting with achievable SLOs builds credibility—you can always tighten them later.

### Step 4: Calculating Error Budgets

The error budget is where SLOs become actionable. Here's the math for my API availability SLO:

- **SLO**: 99.9% availability
- **Error Budget**: 100% - 99.9% = **0.1%**
- **Time window**: 30 days
- **Total minutes**: 30 × 24 × 60 = 43,200 minutes
- **Allowed downtime**: 0.1% × 43,200 = **43.2 minutes**

This means I can afford **43.2 minutes of unavailability per month**. Once that budget is exhausted, I stop deploying new features and focus purely on reliability work.

### Step 5: Implementing Error Budget Policies

An error budget is useless without a policy. Here's the framework I adopted:

| Budget Remaining | Action |
|-----------------|--------|
| **> 50%** | Normal development velocity—ship features freely |
| **25-50%** | Caution mode—reduce risky deployments, increase testing |
| **< 25%** | Freeze risky changes—focus only on reliability improvements |
| **Exhausted (0%)** | Hard freeze—no non-critical changes until budget recovers |

This gives me a data-driven decision-making framework. Instead of arguing about "should we deploy on Friday?", we check the error budget.

### Step 6: Alerting on SLO Violations

Simply defining SLOs isn't enough—you need to know when you're violating them. I implemented **burn rate alerts**, which are smarter than simple threshold alerts.

**What is burn rate?** It measures how fast you're consuming your error budget.

For a 99.9% SLO over 30 days:
- **Normal burn rate**: 1x (consuming budget at the expected rate)
- **High burn rate**: 14.4x (at this rate, you'll exhaust your budget in 2 hours)

Here are my alerting thresholds:

| Alert | Condition | Severity | Reasoning |
|-------|-----------|----------|-----------|
| **SLO Burn Rate High** | >14.4x burn rate for 1 hour | Critical | If this continues, we'll blow through the entire monthly budget in 2 hours. Page immediately. |
| **SLO Burn Rate Elevated** | >6x burn rate for 6 hours | Warning | Concerning but not emergency. Investigate during business hours. |
| **Error Budget Low** | <25% remaining | Warning | Time to reduce risky changes. |
| **Error Budget Exhausted** | 0% remaining | Critical | Freeze all non-essential work. |

Here's an example Prometheus alert rule I created:

```yaml
groups:
- name: sre-platform-alerts
  rules:
  # High Error Rate Alert (Availability SLO)
  - alert: HighErrorRate
    expr: |
      sum(rate(http_request_duration_seconds_count{status=~"5.."}[5m])) 
      / 
      sum(rate(http_request_duration_seconds_count[5m])) > 0.01
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High API Error Rate (>1%)"
      description: "API error rate is {{ $value | humanizePercentage }} (SLO is 99.9% availability)."

  # Latency SLO Alert
  - alert: HighLatency
    expr: |
      histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.3
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High P99 Latency (>300ms)"
      description: "P99 latency is {{ $value | humanizeDuration }} (SLO is <300ms)."
```

## Challenges I Encountered

### 1. Choosing the Right Measurement Window
Initially, I used a 5-minute rolling window. But this was too sensitive—a single bad request could trigger false alarms. I switched to a 30-day rolling window for SLO compliance, with shorter windows (5m, 1h, 6h) for burn rate alerts.

### 2. Avoiding Vanity Metrics
It's tempting to set a 99.99% SLO because it "looks impressive." But:
- Can my infrastructure actually support it?
- Does my business actually need it?

I learned to align SLOs with user expectations and infrastructure reality, not ego.

### 3. Instrumentation Overhead
Adding metrics everywhere can slow down your application. I use Prometheus histograms for latency, which have a small memory cost, but I'm careful to keep cardinality low (avoiding high-cardinality labels like user IDs).

## Monitoring the SLOs in Action

All of this is visualized in my Grafana dashboard at `monitor.sanjeevsethi.in`. The dashboard shows:

- **Current SLI values** (real-time)
- **SLO compliance status** (green if meeting target, red if violating)
- **Error budget remaining** (as a percentage and time remaining)
- **Burn rate trends** (to catch issues early)

Being able to *see* the data makes SLOs feel real and actionable, not just theoretical numbers in a document.

## Key Takeaways

If you're implementing SLIs and SLOs for the first time, here's my advice:

1. **Start simple**: Pick 2-3 critical user journeys. You can always add more later.
2. **Be realistic**: Don't copy Google's SLOs. Set targets based on *your* infrastructure and user needs.
3. **Automate measurement**: Manual SLO tracking is doomed to fail. Use Prometheus, Datadog, or similar tools.
4. **Make error budgets visible**: Put them on dashboards. Discuss them in standups. Make them part of your culture.
5. **Iterate**: Your first SLOs won't be perfect. Review quarterly and adjust based on actual incidents and user feedback.

## What's Next?

I'm currently working on:
- **Multi-window, multi-burn-rate alerting** (more sophisticated than my current simple threshold alerts)
- **SLO-based deployment gates** (automatically roll back if a deployment burns through error budget too quickly)
- **User-facing status page** showing real-time SLO compliance

SLIs and SLOs have transformed how I think about reliability. Instead of reacting to incidents, I now have a proactive framework for balancing innovation with stability.

---

## Resources

If you want to dive deeper, here are the resources that helped me:

- [Google SRE Book - Chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [The Site Reliability Workbook - Chapter 2: Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Prometheus Best Practices - Histograms and Summaries](https://prometheus.io/docs/practices/histograms/)
- [Alex Hidalgo's "Implementing Service Level Objectives"](https://www.oreilly.com/library/view/implementing-service-level/9781492076803/) (book)

You can explore my full implementation in the [sre-platform-app](https://github.com/Sanjeevliv/sre-platform-app) repository, including the Prometheus rules, Grafana dashboards, and SLI/SLO documentation.

Got questions about implementing SLOs in your own projects? Feel free to reach out—I'd love to compare notes!
