# SRE Portfolio Website

My **Site Reliability Engineering Portfolio** built with [Hugo](https://gohugo.io/) and the [Docsy](https://www.docsy.dev/) theme.

**🌐 Live Site:** [https://sanjeevsethi.in](https://sanjeevsethi.in)

## ✨ Features

- **Docsy Theme** - Professional documentation-style design (same family as kubernetes.io)
- **Dark/Light Mode** - Toggle with 🗿 (dark) and 🤡 (light) emojis
- **Mermaid Diagrams** - Architecture diagrams render as interactive flowcharts
- **Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Generator | Hugo (Extended) |
| Theme | [Docsy](https://www.docsy.dev/) (Hugo Module) |
| Styling | SCSS with CSS Variables |
| Hosting | GitHub Pages |
| Deployment | GitHub Actions |
| Domain | Google Cloud DNS |

## 🚀 Local Development

### Prerequisites
- [Hugo Extended](https://gohugo.io/installation/) (v0.110.0+)
- [Go](https://go.dev/dl/) (for Hugo modules)
- [Node.js](https://nodejs.org/) (for PostCSS)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Sanjeevliv/portfolio-site.git
cd portfolio-site

# Install dependencies
npm install

# Run the development server
hugo server -D

# View at http://localhost:1313
```

## 📂 Project Structure

```
portfolio-site/
├── assets/scss/           # Custom SCSS (theme variables)
├── content/
│   ├── _index.md          # Homepage
│   ├── docs/              # Documentation pages
│   └── blog/              # Blog posts
├── layouts/partials/      # Custom partials (navbar with theme toggle)
├── hugo.yaml              # Site configuration
├── go.mod                 # Hugo module dependencies
└── package.json           # Node.js dependencies (PostCSS)
```

## 🎨 Theme Toggle

The site supports dark/light mode with CSS variables for future-proof theming:

```scss
:root, [data-bs-theme="dark"] {
    --bg-primary: #0d1117;
    --text-primary: #e6edf3;
}

[data-bs-theme="light"] {
    --bg-primary: #ffffff;
    --text-primary: #24292f;
}
```

Any new page automatically inherits the theme.

## 📦 Deployment

Automated via **GitHub Actions** on push to `main`:
1. Builds Hugo site
2. Deploys to GitHub Pages

## 📝 Related Repositories

- [sre-platform-app](https://github.com/sanjeevliv/sre-platform-app) - Go microservices
- [sre-platform-infra](https://github.com/sanjeevliv/sre-platform-infra) - Terraform infrastructure
