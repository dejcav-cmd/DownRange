import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export default defineConfig({
  name: 'downrange',
  title: 'DownRange CMS',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [
    deskTool({
      structure: (S) =>
        S.list()
          .title('DownRange')
          .items([
            S.listItem().title('Breaking Alerts').child(S.documentTypeList('breakingAlert')),
            S.listItem().title('News Articles').child(S.documentTypeList('newsArticle')),
            S.listItem().title('Laws & Legislation').child(S.documentTypeList('legislation')),
            S.listItem().title('Reviews').child(S.documentTypeList('review')),
            S.listItem().title('New Releases').child(S.documentTypeList('firearmRelease')),
            S.listItem().title('State Profiles').child(S.documentTypeList('stateProfile')),
            S.listItem().title('Ammo Prices').child(S.documentTypeList('ammoPrice')),
            S.listItem().title('Videos').child(S.documentTypeList('video')),
            S.listItem().title('Authors').child(S.documentTypeList('author')),
            S.listItem().title('Global Stats').child(S.documentTypeList('globalStats')),
          ])
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
})
