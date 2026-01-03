---
title: "SRE Portfolio"
linkTitle: "Home"
---

{{< blocks/cover title="Hey, I'm Sanjeev 👋" image_anchor="top" height="full" >}}
<a class="btn btn-lg btn-primary me-3 mb-4" href="/docs/architecture/">
  View Architecture <i class="fas fa-arrow-alt-circle-right ms-2"></i>
</a>
<a class="btn btn-lg btn-secondary me-3 mb-4" href="https://github.com/sanjeevliv/sre-platform-app">
  GitHub <i class="fab fa-github ms-2 "></i>
</a>
<a class="btn btn-lg btn-success me-3 mb-4" href="http://monitor.sanjeevsethi.in">
  Live Dashboard <i class="fas fa-chart-line ms-2"></i>
</a>
<p class="lead mt-5">B.Tech student at NIT Karnataka, Surathkal. Learning SRE by building production-grade infrastructure on GCP.</p>
{{< blocks/link-down color="info" >}}
{{< /blocks/cover >}}


{{% blocks/lead color="primary" %}}
## What's Running

A production-grade microservices platform on **Google Cloud** with full observability, security hardening, and GitOps deployment.
{{% /blocks/lead %}}

{{< blocks/section color="dark" type="row" >}}
<div class="col-lg-4 mb-5 mb-lg-0 text-center">
  <img src="https://go.dev/blog/go-brand/Go-Logo/PNG/Go-Logo_Blue.png" alt="Go" style="height: 80px; margin-bottom: 1rem;">
  <h4>Go Microservices</h4>
  <p>2 services with clean architecture, graceful shutdown, and health endpoints</p>
</div>

<div class="col-lg-4 mb-5 mb-lg-0 text-center">
  <img src="https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.svg" alt="Kubernetes" style="height: 80px; margin-bottom: 1rem;">
  <h4>Kubernetes (GKE)</h4>
  <p>Autopilot cluster with Network Policies, non-root containers, and read-only filesystems</p>
</div>

<div class="col-lg-4 mb-5 mb-lg-0 text-center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" alt="Redis" style="height: 80px; margin-bottom: 1rem;">
  <h4>Redis Queue</h4>
  <p>Async job processing with producer-consumer pattern</p>
</div>
{{< /blocks/section >}}

{{< blocks/section type="row" >}}
<div class="col-lg-4 mb-5 mb-lg-0 text-center">
  <a href="http://monitor.sanjeevsethi.in">
    <img src="https://grafana.com/static/img/menu/grafana2.svg" alt="Grafana" style="height: 80px; margin-bottom: 1rem;">
  </a>
  <h4>Observability</h4>
  <p>Prometheus metrics, Grafana dashboards, OpenTelemetry tracing with trace_id in logs</p>
</div>

<div class="col-lg-4 mb-5 mb-lg-0 text-center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" style="height: 80px; margin-bottom: 1rem; filter: invert(1);">
  <h4>GitOps CI/CD</h4>
  <p>GitHub Actions builds, tests, and deploys to GKE via Helm on every push</p>
</div>

<div class="col-lg-4 mb-5 mb-lg-0 text-center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg" alt="Terraform" style="height: 80px; margin-bottom: 1rem;">
  <h4>Terraform IaC</h4>
  <p>100% infrastructure as code: VPC, GKE, Cloud DNS, all version controlled</p>
</div>
{{< /blocks/section >}}


{{< blocks/section color="primary" type="row" >}}

{{% blocks/feature icon="fa-brands fa-golang" title="Languages" %}}
Go • Python • Bash
{{% /blocks/feature %}}

{{% blocks/feature icon="fa-brands fa-docker" title="Infrastructure" %}}
Kubernetes (GKE) • Terraform • Docker
{{% /blocks/feature %}}

{{% blocks/feature icon="fa-brands fa-github" title="CI/CD" %}}
GitHub Actions • Helm
{{% /blocks/feature %}}

{{% blocks/feature icon="fa-solid fa-fire" title="Observability" %}}
Prometheus • Grafana • OpenTelemetry
{{% /blocks/feature %}}

{{< /blocks/section >}}


{{% blocks/lead color="dark" %}}
## Connect

<div class="mx-auto mt-4 text-center">
  <a class="btn btn-social-icon btn-email me-3" href="https://mail.google.com/mail/?view=cm&fs=1&to=sanjeevsethilive@gmail.com" target="_blank" rel="noopener" aria-label="Email">
      <svg viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <path fill="#0085f7" d="M34.909 448.047h81.455V250.229l-53.338-93.138L0 162.956v250.182c0 19.287 15.622 34.909 34.909 34.909z" opacity="1" data-original="#0085f7"></path>
          <path fill="#00a94b" d="M395.636 448.047h81.455c19.287 0 34.909-15.622 34.909-34.909V162.956l-62.935-5.865-53.428 93.138v197.818z" opacity="1" data-original="#00a94b"></path>
          <path fill="#ffbc00" d="m395.636 98.956-47.847 91.303 47.847 59.97L512 162.956v-46.545c0-43.142-49.251-67.782-83.782-41.891z" opacity="1" data-original="#ffbc00"></path>
          <path fill="#ff4131" d="m116.364 250.229-45.593-96.31 45.593-54.963L256 203.683 395.636 98.956v151.273L256 354.956z" opacity="1" data-original="#ff4131"></path>
          <path fill="#e51c19" d="M0 116.411v46.545l116.364 87.273V98.956L83.782 74.52C49.251 48.629 0 73.269 0 116.411z" opacity="1" data-original="#e51c19"></path>
      </svg>
  </a>
  <a class="btn btn-social-icon btn-github me-3" href="https://github.com/sanjeevliv" aria-label="GitHub">
      <svg viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
  </a>
  <a class="btn btn-social-icon btn-linkedin me-3" href="https://linkedin.com/in/sanjeevliv" aria-label="LinkedIn">
      <svg viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <path fill="#0b66c2" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
  </a>
</div>
{{% /blocks/lead %}}
