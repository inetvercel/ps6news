# Quick Start Guide - PS6News.com with Sanity CMS

## ✅ What's Been Set Up

Your PS6News.com site now has:
- ✅ Sanity CMS integration
- ✅ WordPress import script
- ✅ Content schemas (Articles, Pages, Categories, Authors)
- ✅ React components updated to fetch from Sanity
- ✅ Fallback content (works without Sanity configured)

## 🚀 Next Steps

### Option 1: Run Without Sanity (Quick Preview)

The site works immediately with fallback content:

```bash
npm run dev
```

Visit `http://localhost:3000` - You'll see sample PS6 news articles.

### Option 2: Set Up Sanity CMS (Full Features)

#### Step 1: Create Sanity Account & Project

1. Go to https://www.sanity.io and sign up
2. Install Sanity CLI:
   ```bash
   npm install -g @sanity/cli
   ```
3. Login:
   ```bash
   sanity login
   ```
4. Initialize (in a separate terminal):
   ```bash
   sanity init
   ```
   - Choose "Create new project"
   - Name it "PS6News" (or your preference)
   - Use default dataset: "production"
   - **Save your Project ID!**

#### Step 2: Get Your API Token

1. Go to https://www.sanity.io/manage
2. Select your project
3. Navigate to: **API** → **Tokens**
4. Click **Add API Token**
5. Name: "PS6News Import"
6. Permissions: **Editor**
7. **Copy the token** (you won't see it again!)

#### Step 3: Configure Environment

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   SANITY_PROJECT_ID=abc123xyz    # Your project ID from Step 1
   SANITY_DATASET=production
   SANITY_TOKEN=sk_xxx...         # Your token from Step 2
   
   WORDPRESS_URL=https://your-wordpress-site.com  # If importing
   
   VITE_SANITY_PROJECT_ID=abc123xyz  # Same as above
   VITE_SANITY_DATASET=production
   ```

#### Step 4: Update Config Files

Edit `sanity.config.js` and `sanity.cli.js` - they'll automatically read from your `.env` file, but you can hardcode your project ID if preferred.

#### Step 5: Start Sanity Studio

```bash
npm run sanity
```

Visit `http://localhost:3333` to access your CMS!

#### Step 6: Add Content

**Option A: Manual Entry**
- Open Sanity Studio at `http://localhost:3333`
- Create categories, authors, and articles

**Option B: Import from WordPress**
1. Set `WORDPRESS_URL` in `.env`
2. Run:
   ```bash
   npm run import:wordpress
   ```

#### Step 7: Run Your Site

```bash
npm run dev
```

Visit `http://localhost:3000` - Now pulling from Sanity!

## 📝 Content Management

### Sanity Studio Commands

```bash
npm run sanity              # Run locally at localhost:3333
npm run sanity:deploy       # Deploy to Sanity's cloud
```

### WordPress Import

```bash
npm run import:wordpress    # Import all WP content
```

This imports:
- Posts → Articles
- Pages → Pages  
- Categories → Categories
- Authors → Authors

## 🔧 Troubleshooting

### "Using fallback articles" in console
- This is normal if Sanity isn't configured yet
- The site works with sample data

### Import script fails
- Check `WORDPRESS_URL` is correct
- Verify WordPress REST API is enabled
- Test: `https://your-site.com/wp-json/wp/v2/posts`

### CORS errors
- Add your domain to Sanity CORS settings
- Go to: Manage → Your Project → API → CORS Origins
- Add: `http://localhost:3000`

## 📚 Documentation

- Full setup guide: `SANITY_SETUP.md`
- Main README: `README.md`
- Sanity docs: https://www.sanity.io/docs

## 🎯 What You Can Do Now

1. **Create Articles** - Add PS6 news through Sanity Studio
2. **Manage Categories** - Organize content (News, Specs, Rumors, etc.)
3. **Add Authors** - Create author profiles
4. **Import WordPress** - Migrate existing content
5. **Customize Schemas** - Edit `sanity/schemas/` files
6. **Build Features** - Add search, filters, article pages, etc.

## 🌐 Deployment

When ready to deploy:

```bash
npm run build              # Build React app
npm run sanity:deploy      # Deploy Sanity Studio
```

Then deploy the `dist/` folder to:
- Netlify
- Vercel
- Any static host

---

**Need help?** Check `SANITY_SETUP.md` for detailed instructions!
