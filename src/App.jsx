import { RouterProvider } from 'react-router-dom'
import Layout from './Layout.jsx'
import { router } from './router.jsx'

export default function App() {
  return (
    <Layout>
      <RouterProvider router={router} />
    </Layout>
  )
}
