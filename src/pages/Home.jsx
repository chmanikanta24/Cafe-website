import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user, isAuthenticated } = useAuth()

  return (
    <section className="home">
      {isAuthenticated && (
        <div className="welcome-section">
          <h2>Welcome back, {user?.name}!</h2>
          <p>Ready to order your favorite coffee?</p>
        </div>
      )}
      <div className="hero">
        <div>
          <h1>Artisan Coffee, Cozy Vibes</h1>
          <p>Freshly roasted beans, handcrafted brews, and pastries baked daily. Settle in and stay a while.</p>
        </div>
      </div>
    </section>
  )
}


