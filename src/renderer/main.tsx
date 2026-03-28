import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'
import { initAppData } from './utils/data-loader'

async function bootstrap(): Promise<void> {
  await initAppData()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  )
}

bootstrap().catch((err) => {
  document.getElementById('root')!.innerHTML =
    `<div style="color:#f87171;padding:2rem;font-family:monospace">` +
    `<h1>Failed to load app data</h1><pre>${String(err)}</pre></div>`
})
