---
title: "System Architecture"
date: 2025-12-21T12:00:00+05:30
draft: false
---

# Platform Architecture

The SRE Portfolio platform runs on a production-grade Kubernetes cluster provisioned via Terraform on Google Cloud Platform. This page details the infrastructure, deployment pipeline, and observability stack.

## 1. Cloud Infrastructure (GKE)

The foundation is a **GKE Autopilot** cluster running in a custom VPC. All infrastructure is managed as code (IaC) using Terraform.

### Architecture Diagram

```mermaid
graph TB
    subgraph GCP["Google Cloud Platform (Asia-South1)"]
        subgraph VPC["sre-platform-vpc"]
            subgraph Subnet["sre-platform-subnet"]
                GKE["GKE Autopilot Cluster"]
                Ingress["Ingress (HTTPS)"]
                
                subgraph Nodes["Cluster Nodes"]
                    API["api-service (Go)"]
                    Worker["worker-service (Go)"]
                    Redis["redis (Cache)"]
                end
            end
        end
        DNS["Cloud DNS (sanjeevsethi.in)"] --> Ingress
        GCR["Artifact Registry"] -.-> |Pulls Images| Nodes
    end
```

### Key Decisions
* **GKE Autopilot**: Selected for zero-overhead node management and built-in security best practices.
* **Terraform State**: Stored remotely in GCS buckets for team collaboration and lock safety.
* **Network**: Complete VPC isolation with minimal public exposure.

---

## 2. CI/CD Pipeline

We follow GitOps principles where possible. Deployment is automated via GitHub Actions.

```mermaid
graph LR
    Dev[Developer] -->|git push| GitHub[GitHub Repo]
    GitHub -->|Trigger| Actions[GitHub Actions]
    
    subgraph CI["Continuous Integration"]
        Actions -->|Test| GoTest["Go Test & Vet"]
        GoTest -->|Build| DockerBuild["Docker Build"]
        DockerBuild -->|Push| GCR["Artifact Registry"]
    end
    
    subgraph CD["Continuous Deployment"]
        GCR -->|Deploy| Helm["Helm Upgrade"]
        Helm -->|Release| GKE["GKE Cluster"]
    end
```

### Pipeline Steps
1. **Test**: Runs `go test ./...` and `go vet` to ensure code quality.
2. **Build**: Builds multi-stage Docker images (optimized using distroless base).
3. **Publish**: Pushes tagged images to Google Artifact Registry.
4. **Deploy**: Uses Helm to upgrade the application on GKE, ensuring zero-downtime rolling updates.

---

## 3. Observability Stack

The platform implements the three pillars of observability:

* **Metrics**: Prometheus (Google Managed) scrapes endpoints. Grafana visualizes Golden Signals (Latency, Traffic, Errors, Saturation).
* **Logs**: Structured JSON logging (Zerolog) with correlation IDs.
* **Traces**: OpenTelemetry (OTel) instrumentation for end-to-end request tracing.
