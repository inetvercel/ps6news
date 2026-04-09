# PS6News.com

A modern, responsive news website dedicated to PlayStation 6 news, rumors, and updates, powered by Sanity CMS.

## Features

- 🎮 Latest PS6 news and updates
- 📱 Fully responsive design
- 🎨 Modern UI with TailwindCSS
- ⚡ Fast performance with Vite
- 🔍 Search functionality
- 📰 Trending topics sidebar
- 📅 Upcoming gaming events
- 💌 Newsletter subscription
- 📝 Sanity CMS for content management
- 🔄 WordPress import functionality

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **Sanity CMS** - Headless CMS
- **Axios** - HTTP client for WordPress import

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Sanity CMS

See `SANITY_SETUP.md` for detailed instructions on:
- Creating a Sanity project
- Setting up environment variables
- Configuring the CMS
- Importing WordPress content

Quick setup:
1. Copy `.env.example` to `.env`
2. Add your Sanity project ID and token
3. Add your WordPress URL (if importing)

### 3. Run Development Server

```bash
npm run dev
```

The site will be available at `http://localhost:3000`

### 4. Run Sanity Studio (Optional)

```bash
npm run sanity
```

Sanity Studio will be available at `http://localhost:3333`

### 5. Import WordPress Content (Optional)

```bash
npm run import:wordpress
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deploy Sanity Studio

```bash
npm run sanity:deploy
```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── NewsGrid.jsx
│   │   ├── NewsCard.jsx
│   │   ├── Sidebar.jsx
│   │   └── Footer.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Disclaimer

This is a fan-made news website and is not affiliated with Sony Interactive Entertainment.
