import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_PROJECT_ID || 'your-project-id',
    dataset: process.env.SANITY_DATASET || 'production'
  }
})
