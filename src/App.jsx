import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Home from '@pages/Home.jsx'
import Menu from '@pages/Menu.jsx'
import About from '@pages/About.jsx'
import Contact from '@pages/Contact.jsx'
import Orders from '@pages/Orders.jsx'
import AuthModal from './components/AuthModal'
import { useState } from 'react'

function Header() {
  const { user, signOut, isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <>
      <header className="site-header">
        <div className="brand">Cafe Aroma</div>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          {isAuthenticated && <Link to="/orders">My Orders</Link>}
        </nav>
        <div className="auth-section">
          {isAuthenticated ? (
            <button onClick={signOut} className="logout-btn">Logout</button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="auth-btn">
              Login / Sign Up
            </button>
          )}
        </div>
      </header>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          <Header />
          <main className="site-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/orders" element={<Orders />} />
            </Routes>
          </main>
          <footer className="site-footer">
            <p>© {new Date().getFullYear()} Cafe Aroma. All rights reserved.</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
