import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DetailPage } from './features/items/DetailPage'
import { FormPage } from './features/items/FormPage'
import { ListPage } from './features/items/ListPage'
import { useTema } from './settings/theme'

// HashRouter: fungerer på GitHub Pages uten serveroppsett
export default function App() {
  useTema() // holder temaet riktig på alle sider
  return (
    <HashRouter>
      <div className="mx-auto min-h-dvh max-w-3xl px-4">
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/ny" element={<FormPage />} />
          <Route path="/ting/:id" element={<DetailPage />} />
          <Route path="/ting/:id/rediger" element={<FormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
