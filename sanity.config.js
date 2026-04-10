import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {schemaTypes} from './sanity/schemas'

export default defineConfig({
  name: 'default',
  title: 'PS6News CMS',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  plugins: [deskTool(), visionTool(), media()],

  schema: {
    types: schemaTypes,
  },
})
