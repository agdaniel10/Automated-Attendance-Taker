import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
      <Toaster
        richColors
        closeButton
        position="top-right"
        toastOptions={{
          className: 'font-["Aptos","Segoe_UI","Trebuchet_MS",sans-serif]',
          style: {
            borderRadius: '1rem',
          },
        }}
      />
    </HashRouter>
  </StrictMode>,
)
