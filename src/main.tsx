import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted brand fonts (same-origin, so they also load in the Pomodoro PiP window).
import '@fontsource-variable/manrope'
import '@fontsource-variable/literata/opsz.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './index.css'
import './i18n'
import { installChunkReloadHandler } from './lib/chunkReload'
import App from './App.tsx'

installChunkReloadHandler()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
