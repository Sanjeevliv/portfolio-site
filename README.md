# SRE Portfolio Website

This repository contains the source code for my **Site Reliability Engineering Portfolio**, built with [Hugo](https://gohugo.io/) and the [Ananke](https://github.com/theNewDynamic/gohugo-theme-ananke) theme.

**Live Site:** [https://sanjeevsethi.in](https://sanjeevsethi.in)

## 🛠️ Technology Stack
*   **Generator:** Hugo (Static Site Generator)
*   **Theme:** Ananke
*   **Hosting:** GitHub Pages
*   **Deployment:** GitHub Actions (CI/CD)
*   **Infrastructure:** Custom Domain managed via Google Cloud DNS (see `sre-platform-infra`)

## 🚀 Local Development

### Prerequisites
*   [Hugo](https://gohugo.io/installation/) (Extended version recommended)
*   Git

### Quick Start
1.  **Clone the repository** (recurse submodules to get the theme):
    ```bash
    git clone --recurse-submodules https://github.com/Sanjeevliv/portfolio-site.git
    cd portfolio-site
    ```

2.  **Run the development server**:
    ```bash
    hugo server -D
    ```

3.  **View the site**:
    Open [http://localhost:1313](http://localhost:1313) in your browser.

## 📦 Deployment

deployment is automated via **GitHub Actions**.
*   **Workflow:** `.github/workflows/hugo.yaml`
*   **Trigger:** Push to `main` branch.
*   **Process:** Builds the Hugo site and deploys the `public/` directory to GitHub Pages.

## 📂 Project Structure
*   `content/` - Markdown content for pages and blog posts.
*   `themes/` - Submodule for the Ananke theme.
*   `hugo.yaml` - Main configuration file.
