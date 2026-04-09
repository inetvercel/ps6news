# Sanity CMS Setup Guide for PS6News.com

## Overview

PS6News.com now uses Sanity as its headless CMS. This guide will help you set up Sanity and import content from WordPress.

## Prerequisites

- Node.js installed
- A Sanity account (sign up at https://www.sanity.io)
- Access to your WordPress site's REST API

## Step 1: Create a Sanity Project

1. Install Sanity CLI globally (if not already installed):
   ```bash
   npm install -g @sanity/cli
   ```

2. Login to Sanity:
   ```bash
   sanity login
   ```

3. Initialize your Sanity project:
   ```bash
   sanity init
   ```
   - Choose "Create new project"
   - Give it a name (e.g., "PS6News")
   - Use the default dataset configuration (production)
   - Note your Project ID

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your credentials:
   ```env
   # Sanity Configuration
   SANITY_PROJECT_ID=your-project-id-here
   SANITY_DATASET=production
   SANITY_TOKEN=your-token-with-write-access
   
   # WordPress Import Configuration
   WORDPRESS_URL=https://your-wordpress-site.com
   
   # Vite Public Variables
   VITE_SANITY_PROJECT_ID=your-project-id-here
   VITE_SANITY_DATASET=production
   ```

3. Get a Sanity token with write access:
   - Go to https://www.sanity.io/manage
   - Select your project
   - Go to API → Tokens
   - Create a new token with "Editor" permissions
   - Copy the token to your `.env` file

## Step 3: Update Configuration Files

Update `sanity.config.js` and `sanity.cli.js` with your actual project ID (or they'll read from .env).

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Start Sanity Studio

Run the Sanity Studio locally:

```bash
npm run sanity
```

This will start Sanity Studio at `http://localhost:3333`

## Step 6: Import WordPress Content

Once you have your WordPress URL configured in `.env`, run the import script:

```bash
npm run import:wordpress
```

This will:
- Fetch all posts, pages, categories, and authors from WordPress
- Convert them to Sanity documents
- Import them into your Sanity dataset

### What Gets Imported

- **Authors** → Sanity `author` documents
- **Categories** → Sanity `category` documents
- **Posts** → Sanity `article` documents
- **Pages** → Sanity `page` documents

Each imported item retains its WordPress ID in the `wordpressId` field for tracking.

## Step 7: Deploy Sanity Studio (Optional)

To deploy your Sanity Studio to the cloud:

```bash
npm run sanity:deploy
```

## Content Schemas

### Article Schema
- Title
- Slug
- Author (reference)
- Main Image
- Category (reference)
- Published Date
- Excerpt
- Body (rich text)
- Featured flag
- WordPress ID (for migration tracking)

### Page Schema
- Title
- Slug
- Body (rich text)
- Published Date
- WordPress ID

### Category Schema
- Title
- Slug
- Description

### Author Schema
- Name
- Slug
- Image
- Bio

## Using Sanity in the React App

The React app automatically fetches content from Sanity. Key functions in `src/lib/sanity.js`:

- `getArticles(limit)` - Fetch latest articles
- `getArticleBySlug(slug)` - Get single article
- `getPages()` - Fetch all pages
- `getPageBySlug(slug)` - Get single page
- `getCategories()` - Fetch all categories
- `getFeaturedArticles(limit)` - Get featured articles

## Fallback Content

The app includes fallback content that displays when:
- Sanity is not configured
- Network issues occur
- No content exists in Sanity yet

## Troubleshooting

### Import Script Fails
- Verify your WordPress URL is correct and accessible
- Check that WordPress REST API is enabled
- Ensure your Sanity token has write permissions

### Images Not Displaying
- Images from WordPress are referenced by URL
- For better performance, consider uploading images to Sanity's asset system

### CORS Errors
- Add your domain to Sanity's CORS origins in project settings
- Go to https://www.sanity.io/manage → Your Project → API → CORS Origins

## Next Steps

1. Customize the schemas in `sanity/schemas/` as needed
2. Add more content through Sanity Studio
3. Create custom queries in `src/lib/sanity.js`
4. Build out article detail pages
5. Add search functionality
