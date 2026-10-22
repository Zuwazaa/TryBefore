import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/newsreader'
import '@fontsource-variable/instrument-sans'
import './index.css'
import App from './App'
import { AppProvider } from './context/AppContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppProvider>
      <App />
    </AppProvider>
  </BrowserRouter>,
)
