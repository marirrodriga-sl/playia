import Navbar from './Navbar.jsx'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-sky-100 text-sky-950">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  )
}
