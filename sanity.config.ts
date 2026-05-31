import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {UsersIcon, ImageIcon} from '@sanity/icons'
import {schemaTypes} from './sanity/schemas'
import SubscribersTool from './sanity/tools/SubscribersTool'
import WatermarkTool from './sanity/tools/WatermarkTool'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export default defineConfig({
  name: 'default',
  title: 'PS6News CMS', // v2
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [deskTool(), visionTool(), media()],
  tools: (prev) => [
    ...prev,
    {
      name: 'subscribers',
      title: 'Subscribers',
      icon: UsersIcon,
      component: SubscribersTool,
    },
    {
      name: 'watermark',
      title: 'Watermark',
      icon: ImageIcon,
      component: WatermarkTool,
    },
  ],
  schema: {
    types: schemaTypes,
  },
})
