# Next.js + Sanity Migration Guide

## ✅ Migration Complete

PS6News.com has been migrated from **Vite/React** to **Next.js 14 App Router** with optimized Sanity CMS integration.

## 🏗️ New Architecture

### **Frontend: Next.js 14**
- App Router (server components by default)
- TypeScript support
- Optimized image loading with `next/image`
- Built-in API routes

### **CMS: Sanity Studio**
- Embedded at `/studio` route
- Accessible at `http://localhost:3000/studio`
- No separate port needed

### **Integration: next-sanity**
- CDN-enabled client (`useCdn: true`)
- Server-side data fetching
- Webhook-based revalidation
- Optimized GROQ queries

### **Hosting Strategy**
- **Frontend**: Vercel (recommended) or any Next.js host
- **Studio**: Embedded in Next.js app
- **Content**: Sanity CDN
- **Images**: Sanity CDN + Next.js Image Optimization

## 📁 New Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (server component)
│   ├── globals.css             # Global styles
│   ├── studio/[[...index]]/    # Embedded Sanity Studio
│   │   └── page.tsx
│   └── api/
│       └── revalidate/         # Webhook endpoint
│           └── route.ts
├── components/
│   ├── Header.tsx              # Client component
│   ├── Hero.tsx                # Server component
│   ├── NewsGrid.tsx            # Server component
│   ├── NewsCard.tsx            # Server component
│   ├── Sidebar.tsx             # Server component
│   └── Footer.tsx              # Server component
├── sanity/
│   ├── lib/
│   │   ├── client.ts           # Sanity client (CDN enabled)
│   │   ├── queries.ts          # GROQ queries
│   │   └── image.ts            # Image URL builder
│   └── schemas/
│       ├── article.ts
│       ├── page.ts
│       ├── category.ts
│       └── author.ts
├── scripts/
│   └── import-wordpress.js     # WordPress import script
├── sanity.config.ts            # Sanity Studio config
├── sanity.cli.ts               # Sanity CLI config
├── next.config.js              # Next.js config
├── tsconfig.json               # TypeScript config
└── tailwind.config.js          # Tailwind config
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14
- next-sanity
- Sanity Studio
- TypeScript
- All required dependencies

### 2. Configure Environment

Copy your existing `.env` values to `.env.local`:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=zzzwo1aw
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_REVALIDATE_SECRET=generate-random-string-here
SANITY_TOKEN=your-token-here
WORDPRESS_URL=https://ps6news.com
```

### 3. Run Development Server

```bash
npm run dev
```

- **Frontend**: `http://localhost:3000`
- **Sanity Studio**: `http://localhost:3000/studio`

### 4. (Optional) Run Standalone Studio

```bash
npm run studio
```

Studio will run at `http://localhost:3333`

## 🎯 Key Features & Optimizations

### **1. CDN-Enabled Reads**
```typescript
// sanity/lib/client.ts
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: true,  // ✅ Uses Sanity's CDN for public reads
})
```

### **2. Next.js Caching**
```typescript
// app/page.tsx
export const revalidate = 60  // Revalidate every 60 seconds

async function getArticles() {
  return await client.fetch(articlesQuery, {}, {
    next: {
      revalidate: 60,
      tags: ['articles']  // For tag-based revalidation
    }
  })
}
```

### **3. Webhook Revalidation**
Set up in Sanity:
1. Go to **Manage** → **API** → **Webhooks**
2. Create new webhook:
   - **URL**: `https://your-domain.com/api/revalidate`
   - **Dataset**: `production`
   - **Trigger on**: Create, Update, Delete
   - **Secret**: Use value from `SANITY_REVALIDATE_SECRET`

### **4. Optimized Queries**
```typescript
// sanity/lib/queries.ts
export const articlesQuery = groq`*[_type == "article"] | order(publishedAt desc) [0...20] {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  "author": author->name,        // ✅ Fetch only name
  "category": category->title,   // ✅ Fetch only title
  mainImage {
    asset->{url},                // ✅ Fetch only URL
    alt
  }
}`
```

### **5. Server-Only Tokens**
```typescript
// Write token is NEVER exposed to browser
// Only used in server components, API routes, or import scripts
```

## 📊 Performance Benefits

| Feature | Old (Vite) | New (Next.js) |
|---------|-----------|---------------|
| **Rendering** | Client-side | Server-side (default) |
| **Caching** | None | Built-in + CDN |
| **Images** | Standard `<img>` | Optimized `<Image>` |
| **API Calls** | Every request | Cached + revalidated |
| **Bundle Size** | Full React app | Optimized chunks |
| **SEO** | Limited | Full SSR support |

## 🔧 Development Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run studio       # Run standalone Studio
npm run studio:deploy # Deploy Studio to Sanity
npm run import:wordpress # Import WordPress content
```

## 🌐 Deployment

### **Deploy to Vercel (Recommended)**

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET`
   - `SANITY_REVALIDATE_SECRET`
   - `SANITY_TOKEN` (for imports)
4. Deploy!

### **Set Up Webhook**

After deployment, add webhook in Sanity:
- URL: `https://your-domain.vercel.app/api/revalidate`
- Secret: Your `SANITY_REVALIDATE_SECRET`

## 🔐 Security Best Practices

✅ **Implemented:**
- Write tokens server-side only
- CDN for public reads
- Webhook signature validation
- Environment variable separation

## 📝 Migration Notes

### **What Changed:**
- ❌ Removed Vite
- ❌ Removed old `/src` directory structure
- ✅ Added Next.js App Router
- ✅ Added TypeScript
- ✅ Embedded Sanity Studio
- ✅ Server components by default
- ✅ Optimized caching strategy

### **What Stayed:**
- ✅ All Sanity schemas
- ✅ WordPress import script
- ✅ TailwindCSS styling
- ✅ Component logic
- ✅ Lucide icons

## 🎨 Styling

TailwindCSS configuration remains the same with custom PS6 colors:
```js
colors: {
  ps: {
    blue: '#003087',
    lightblue: '#0070cc',
    dark: '#000000',
  }
}
```

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [next-sanity Docs](https://github.com/sanity-io/next-sanity)
- [Sanity Docs](https://www.sanity.io/docs)
- [Vercel Deployment](https://vercel.com/docs)

## 🐛 Troubleshooting

### TypeScript errors before `npm install`
- Normal - install dependencies first

### Studio not loading
- Check `NEXT_PUBLIC_SANITY_PROJECT_ID` is set
- Verify project ID matches your Sanity project

### Webhook not working
- Verify secret matches in both places
- Check webhook URL is correct
- Test with Sanity's webhook tester

### Images not loading
- Add domain to `next.config.js` `remotePatterns`
- Check Sanity CDN URLs are accessible

---

**Migration completed successfully!** 🎉
