---
title: "The Price of Reliability: A Cost & Resource Breakdown"
date: 2026-01-01
draft: false
tags: ["sre", "finops", "gcp", "kubernetes"]
categories: ["Infrastructure", "SRE Portfolio"]
---

Building a production-grade SRE portfolio isn't just about code; it's about understanding the infrastructure that supports it. One of the key responsibilities of a Site Reliability Engineer (SRE) is balancing reliability with cost—a practice often called FinOps.

In this post, I break down the architecture of this portfolio, the resources it uses on Google Cloud Platform (GCP), and the justification for every dollar spent.

## Infrastructure Overview

My portfolio `sanjeevsethi.in` is not just a static site; it's a living demonstration of SRE principles, backed by a real Kubernetes cluster, automated pipelines, and comprehensive monitoring.

Here is the inventory of resources currently powering this project:

| Resource | Service | Purpose | Estimated Cost |
|----------|---------|---------|----------------|
| **Compute** | GKE Autopilot | Runs API services, workers, and monitoring stack | Pay-for-usage (vCPU/RAM) |
| **Networking** | Cloud Load Balancer | Exposes Grafana & Prometheus (`monitor.sanjeevsethi.in`) | ~$18.00 / mo |
| **DNS** | Cloud DNS | Manages domain records and subdomains | ~$0.20 / mo |
| **Storage** | Artifact Registry | Stores Docker container images | ~$0.10 / GB / mo |
| **Hosting** | GitHub Pages | Hosts this documentation site (Static Content) | Free |

---

## Detailed Breakdown & Justification

### 1. Google Kubernetes Engine (GKE) Autopilot
Instead of manually managing virtual machines (Nodes), I chose **GKE Autopilot**.

*   **Why?**
    *   **Reduced Toil**: As an SRE, I want to minimize operational overhead. Autopilot manages the nodes, security patches, and scaling for me.
    *   **Cost Efficiency**: In Standard GKE, you pay for the *nodes* (e.g., 3 VMs running 24/7), even if they are empty. In Autopilot, I only pay for the **resources my Pods request**. Since my portfolio services are lightweight (requesting only ~100m CPU and ~128Mi RAM), my compute bill is significantly lower than renting dedicated VMs.
    *   **Free Tier**: GCP offers a free tier that covers the cluster management fee ($74/month) for one Autopilot cluster per billing account.

### 2. External Load Balancer
Secure access to my dashboards is critical. I use a Load Balancer to expose the monitoring stack.

*   **Why?**
    *   **Reliability**: It provides a stable, static IP (`34.47.220.97`) that doesn't change when pods restart.
    *   **Justification**: While this is the most expensive single line item (~$18/month), it is necessary to simulate a real-world entry point for traffic, allowing for proper ingress controls and potential DDoS protection.

### 3. Cloud DNS
I use Google Cloud DNS to manage `sanjeevsethi.in`.

*   **Why?**
    *   **Programmability**: I define my DNS records in Terraform (`dns.tf`). This allows me to version control my domain configuration just like my code (Infrastructure as Code).
    *   **Speed**: Google's global DNS network ensures fast resolution times for users anywhere in the world.

### 4. Artifact Registry
Every time I push code, my CI/CD pipeline builds a Docker image and pushes it here.

*   **Why?**
    *   **Security**: Private, secure storage for my application artifacts.
    *   **Speed**: Located in the same region (`asia-south1`) as my GKE cluster, ensuring fast pull times during deployments.

### 5. GitHub Pages
The site you are reading right now is hosted on GitHub Pages.

*   **Why?**
    *   **Simplicity**: It integrates natively with my GitHub repository.
    *   **Cost**: It is completely free for public repositories, removing the need to run a web server container on GKE for static content.

## Total Monthly Estimate

By leveraging GKE Autopilot's density and the Free Tier, and offloading static content to GitHub Pages, I keep the running costs of this "production" environment minimal.

*   **Compute**: ~$5 - $10 (depending on traffic/scaling)
*   **Load Balancing**: ~$18
*   **DNS & Storage**: < $1
*   **Total**: **~$25 - $30 per month**

This architecture proves that you can build a robust, scalable, and observable SRE platform without breaking the bank, provided you choose the right resource models.
