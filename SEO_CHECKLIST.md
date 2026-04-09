# SEO Checklist for PS6News.com Relaunch

## ✅ Technical SEO - COMPLETE

### Meta Tags & Open Graph
- ✅ **Title tags** - Dynamic per page with template
- ✅ **Meta descriptions** - Unique for each page
- ✅ **Open Graph tags** - Full OG implementation
- ✅ **Twitter Cards** - Large image cards
- ✅ **Keywords** - Relevant PS6 keywords
- ✅ **Canonical URLs** - Set on all pages

### Structured Data (JSON-LD)
- ✅ **WebSite schema** - Homepage
- ✅ **NewsArticle schema** - Article pages
- ✅ **Organization schema** - Publisher info
- ✅ **SearchAction** - Site search integration

### URL Structure
- ✅ **Clean URLs** - `/articles/[slug]` format
- ✅ **Slug matching** - WordPress slugs preserved
- ✅ **Trailing slash** - Consistent (removed)
- ✅ **301 redirects** - Middleware handles

### Sitemaps & Robots
- ✅ **XML Sitemap** - Auto-generated at `/sitemap.xml`
- ✅ **robots.txt** - Configured at `/robots.txt`
- ✅ **Dynamic sitemap** - Updates with new articles
- ✅ **Studio blocked** - `/studio/` disallowed

### Performance
- ✅ **Next.js Image** - Optimized images
- ✅ **CDN caching** - Sanity CDN enabled
- ✅ **Page caching** - 60s revalidation
- ✅ **Static generation** - Articles pre-rendered

### Security Headers
- ✅ **X-Frame-Options** - SAMEORIGIN
- ✅ **X-Content-Type-Options** - nosniff
- ✅ **Referrer-Policy** - origin-when-cross-origin
- ✅ **DNS Prefetch** - Enabled

## 📋 Pre-Launch Checklist

### Google Search Console Setup
1. **Verify ownership**
   - Add verification code to `app/layout.tsx` line 66
   - Or use DNS verification
   
2. **Submit sitemap**
   - URL: `https://ps6news.com/sitemap.xml`
   
3. **Request indexing**
   - Submit homepage
   - Submit key article URLs

### Content Optimization
- ✅ **8 articles** imported from WordPress
- ✅ **Slugs preserved** - SEO continuity maintained
- ✅ **Images optimized** - Next.js Image component
- ✅ **Alt tags** - From Sanity mainImage.alt

### Social Media
- [ ] **Create OG image** - Place at `/public/og-image.jpg` (1200x630px)
- [ ] **Create logo** - Place at `/public/logo.png`
- [ ] **Test OG tags** - Use https://www.opengraph.xyz/

### Analytics (Optional)
- [ ] **Google Analytics** - Add GA4 tracking
- [ ] **Google Tag Manager** - For advanced tracking
- [ ] **Search Console** - Link to Analytics

## 🔍 SEO Features by Page

### Homepage (`/`)
- **Title**: PS6News.com - Latest PlayStation 6 News & Updates
- **Description**: Your ultimate source for PlayStation 6 news...
- **Schema**: WebSite + Organization
- **Canonical**: https://ps6news.com
- **Priority**: 1.0 (highest)

### Article Pages (`/articles/[slug]`)
- **Title**: [Article Title] | PS6News.com
- **Description**: [Article Excerpt]
- **Schema**: NewsArticle
- **Canonical**: https://ps6news.com/articles/[slug]
- **Priority**: 0.8
- **Images**: Optimized with Next/Image
- **Semantic HTML**: `<article>`, `<time>`, proper headings

## 🎯 Key SEO Metrics

### Core Web Vitals (Expected)
- **LCP**: < 2.5s (Next.js SSR + CDN)
- **FID**: < 100ms (Minimal JS)
- **CLS**: < 0.1 (Fixed layouts)

### Indexability
- **Crawlable**: ✅ All pages
- **Mobile-friendly**: ✅ Responsive design
- **HTTPS**: ⚠️ Configure on deployment
- **Speed**: ✅ Optimized

## 🚀 Deployment SEO Tasks

### Before Going Live
1. **Update domain** in all files:
   - `app/layout.tsx` - metadataBase
   - `app/sitemap.ts` - URLs
   - `app/robots.ts` - sitemap URL
   - `app/articles/[slug]/page.tsx` - canonical URLs
   - `middleware.ts` - if needed

2. **Create images**:
   ```
   /public/og-image.jpg (1200x630)
   /public/logo.png (512x512)
   /public/favicon.ico
   ```

3. **Google Search Console**:
   - Add property
   - Verify ownership
   - Submit sitemap
   - Monitor indexing

4. **Test URLs**:
   ```
   https://ps6news.com
   https://ps6news.com/sitemap.xml
   https://ps6news.com/robots.txt
   https://ps6news.com/articles/[any-slug]
   ```

### After Launch
1. **Monitor Search Console** - Check for errors
2. **Request indexing** - For key pages
3. **Check mobile usability** - Mobile-first indexing
4. **Monitor Core Web Vitals** - Performance tracking
5. **Set up redirects** - If old URLs differ

## 📊 WordPress Migration SEO

### Slug Preservation
✅ **All WordPress slugs preserved** during import:
- Original slug stored in Sanity
- URLs match: `/articles/[wordpress-slug]`
- No 404s for existing content

### Content Mapping
- WordPress Posts → Sanity Articles
- WordPress Pages → Sanity Pages  
- Categories → Categories
- Authors → Authors
- Images → Sanity CDN (URLs preserved)

### 301 Redirects (If Needed)
If old WordPress URLs were different:
```typescript
// Add to middleware.ts
const redirects = {
  '/old-url': '/articles/new-slug',
}
```

## 🎨 Rich Results Eligibility

### Article Rich Results
- ✅ **headline** - Article title
- ✅ **image** - Main image
- ✅ **datePublished** - Publish date
- ✅ **author** - Author name
- ✅ **publisher** - PS6News.com

### Breadcrumbs (Future)
- Add BreadcrumbList schema
- Improve navigation

## 🔧 Maintenance

### Regular SEO Tasks
- **Weekly**: Check Search Console for errors
- **Monthly**: Review top pages, update content
- **Quarterly**: Audit backlinks, update meta descriptions
- **Yearly**: Full SEO audit

### Content Best Practices
- **Title length**: 50-60 characters
- **Description length**: 150-160 characters
- **H1**: One per page (article title)
- **Images**: Always include alt text
- **Internal linking**: Link between articles

## 🎯 Target Keywords

Primary keywords optimized:
- PS6
- PlayStation 6
- PS6 news
- PS6 release date
- PS6 specs
- PS6 price
- PS6 rumors
- PS6 leaks

## ✅ Final Verification

Before announcing relaunch:
- [ ] All pages load correctly
- [ ] Sitemap accessible
- [ ] Robots.txt configured
- [ ] OG images display
- [ ] Mobile responsive
- [ ] Fast load times
- [ ] No console errors
- [ ] Search Console verified
- [ ] Analytics tracking (if used)
- [ ] Social sharing works

---

**Site is SEO-optimized and ready for relaunch!** 🚀
