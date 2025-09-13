import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchOrders, fetchMenu } from '../lib/api'

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const INR_PER_USD = 85

// Add-on costs in INR (mirror of Menu.jsx)
const ADDON_COSTS = {
  temperature: { 'Hot': 0, 'Cold': 10 },
  sweetness: { 'No Sugar': 0, 'Less Sugar': 0, 'Normal': 0, 'Extra Sweet': 5 },
  milk: { 'Regular': 0, 'Almond': 20, 'Oat': 25, 'Soy': 15 },
}

function computeAddonInr(options) {
  if (!options) return 0
  return (
    (ADDON_COSTS.temperature[options.temperature] || 0) +
    (ADDON_COSTS.sweetness[options.sweetness] || 0) +
    (ADDON_COSTS.milk[options.milk] || 0)
  )
}

export default function Orders() {
  const { isAuthenticated } = useAuth()
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError('')
        
        // Load both orders and menu items in parallel
        const [ordersData, menuData] = await Promise.all([
          fetchOrders(),
          fetchMenu()
        ])
        
        setOrders(ordersData || [])
        setMenuItems(menuData || [])
      } catch (err) {
        console.error('Failed to load orders:', err)
        setError('Failed to load your orders. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated])

  const getItemDetails = (itemId) => {
    return menuItems.find(item => item.id === itemId) || { name: 'Unknown Item', price: 0 }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isAuthenticated) {
    return (
      <section>
        <h2>My Orders</h2>
        <div className="centered">
          <p>Please login to view your orders.</p>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section>
        <h2>My Orders</h2>
        <div className="centered">
          <p>Loading your orders...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h2>My Orders</h2>
        <div className="centered">
          <div className="error-message">{error}</div>
          <button onClick={() => window.location.reload()} className="auth-btn">
            Try Again
          </button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2>My Orders</h2>
      
      {orders.length === 0 ? (
        <div className="centered">
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order._id.slice(-8)}</h3>
                  <p className="order-date">{formatDate(order.createdAt)}</p>
                </div>
                <div className="order-total">
                  <strong>{INR.format(order.amountInr)}</strong>
                </div>
              </div>
              
              <div className="order-items">
                <h4>Items:</h4>
                <div className="items-list">
                  {order.items.map((item, index) => {
                    const itemDetails = getItemDetails(item.id)
                    const baseInr = Math.round((itemDetails.price || 0) * INR_PER_USD)
                    const addonInr = computeAddonInr(item.options)
                    const lineInr = (baseInr + addonInr) * (item.quantity || 1)
                    return (
                      <div key={index} className="order-item">
                        <div className="item-info">
                          <span className="item-name">{itemDetails.name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                        </div>
                        {item.options && (
                          <div className="item-options" style={{opacity:0.8, fontSize:'0.9rem'}}>
                            <span>{item.options.temperature}</span>
                            {item.options.sweetness && <span> • {item.options.sweetness}</span>}
                            {item.options.milk && <span> • {item.options.milk}</span>}
                            <span style={{marginLeft:'0.5rem'}}>({INR.format(baseInr)} + {INR.format(addonInr)} add-ons)</span>
                          </div>
                        )}
                        {!item.options && (
                          <div className="item-options" style={{opacity:0.8, fontSize:'0.9rem'}}>
                            <span>({INR.format(baseInr)})</span>
                          </div>
                        )}
                        <div className="item-price">
                          {INR.format(lineInr)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="order-status">
                <span className="status-badge">Completed</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
