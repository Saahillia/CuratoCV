/**
 * Developer context for frontend/src/main.jsx.
 * Purpose: configure or compose the root application main behavior.
 * Why here: the root shell owns app-wide bootstrap, routing, providers, and integration—not product business logic.
 */
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import {Provider } from 'react-redux'
import { store } from './app/store.js'

// Attach React to the HTML root, then provide routing and the shared Redux store to every mounted page.
createRoot(document.getElementById('root')).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>,
)
