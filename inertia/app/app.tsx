/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import 'leaflet/dist/leaflet.css'
import '../css/app.css'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import AppLayout from '@/components/layouts/app-layout'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx'))
  },

  setup({ el, App, props }) {
    createRoot(el).render(
      <AppLayout>
        <App {...props} />
      </AppLayout>
    )
  },

  progress: {
    color: '#000000',
    delay: 500,
    includeCSS: true,
    showSpinner: true,
  },
})
