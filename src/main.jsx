import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import DineFlowApp from './DineFlowApp'
import { initTheme } from './utils/themeInit'
import './index.css'

initTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <DineFlowApp />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
