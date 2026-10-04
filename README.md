# Sanjeev Sethi — Personal Portfolio

Source code for my personal website, built with [Hugo](https://gohugo.io/) and [Docsy](https://www.docsy.dev/).

**🌐 Live Site:** [https://sanjeevsethi.in](https://sanjeevsethi.in)

## ✨ Features

- **Dark / Light Mode** - Native theme toggle with CSS variable theming
- **Fast & Minimal** - Static site hosted on GitHub Pages
- **Responsive** - Optimized for mobile and desktop reading

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Generator | Hugo (Extended) |
| Theme | [Docsy](https://www.docsy.dev/) (Hugo Module) |
| Styling | SCSS with CSS Variables |
| Hosting | GitHub Pages |
| Deployment | GitHub Actions |
| DNS / CDN | Cloudflare |

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
│   └── blog/              # Blog posts
├── layouts/partials/      # Custom partials (navbar with theme toggle)
├── hugo.yaml              # Site configuration
├── go.mod                 # Hugo module dependencies
└── package.json           # Node.js dependencies (PostCSS)
```

## 📦 Deployment

Automated via **GitHub Actions** on push to `main`:
1. Builds Hugo site
2. Deploys to GitHub Pages
