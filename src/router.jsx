import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home.jsx'
import FichaPlaya from './pages/FichaPlaya.jsx'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/playa/:id', element: <FichaPlaya /> },
])
