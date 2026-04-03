import "./polyfill"

import React from "react"
import ReactDOM from "react-dom/client"

import { App } from "./app"
import { initI18n } from "./i18n"

initI18n().then(() => {
  const rootElement = document.getElementById("root")
  if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
})
