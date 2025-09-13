import { useEffect, useMemo, useState, useRef } from 'react'
import { fetchMenu, createOrder, isApiConfigured } from '../lib/api.js'

const INR_PER_USD = 85
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

// Fallback menu when API is not configured
const FALLBACK_MENU = [
  { id: 'espresso', name: 'Espresso', price: 2.5, category: 'Drinks', img: 'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?q=80&w=600&auto=format&fit=crop' },
  { id: 'cappuccino', name: 'Cappuccino', price: 3.5, category: 'Drinks', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop' },
  { id: 'latte', name: 'Latte', price: 3.8, category: 'Drinks', img: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?q=80&w=600&auto=format&fit=crop' },
  { id: 'americano', name: 'Americano', price: 3.0, category: 'Drinks', img: 'https://images.unsplash.com/photo-1503481766315-7a586b20f66c?q=80&w=600&auto=format&fit=crop' },
  { id: 'mocha', name: 'Mocha', price: 4.2, category: 'Drinks', img: 'https://images.unsplash.com/photo-1521017432531-fbd92d3255a0?q=80&w=600&auto=format&fit=crop' },
  { id: 'coldbrew', name: 'Cold Brew', price: 3.9, category: 'Drinks', img: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=600&auto=format&fit=crop' },
  { id: 'matcha', name: 'Matcha Latte', price: 4.0, category: 'Drinks', img: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=600&auto=format&fit=crop' },
]

// Add-on costs in INR
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

export default function Menu() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  // Cart as array of lines with options
  const [cart, setCart] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [placing, setPlacing] = useState(false)
  const apiReady = isApiConfigured()
  const refreshTimerRef = useRef(null)

  // Options modal state
  const [optionsOpenFor, setOptionsOpenFor] = useState(null)
  const [optTemperature, setOptTemperature] = useState('Hot')
  const [optSweetness, setOptSweetness] = useState('Normal')
  const [optMilk, setOptMilk] = useState('Regular')

  useEffect(() => {
    console.log('apiReady:', apiReady)
    if (!apiReady) {
      setMenuItems(FALLBACK_MENU)
      return
    }
    let cancelled = false

    const loadMenu = async () => {
      console.log("loadMenu");
      
      try {
        setLoadingMenu(true)
        console.log("loadMenu");
        
        const data = await fetchMenu()
        if (cancelled) return
        if (Array.isArray(data)) {
          console.log("data");
          console.log(data);
          
          setMenuItems(data)
        }
      } catch (err) {
        console.error('Failed to fetch menu:', err)
        // keep existing items
      } finally {
        if (!cancelled) setLoadingMenu(false)
      }
    }

    // initial load
    loadMenu()

    // periodic refresh every 30s
    refreshTimerRef.current = setInterval(loadMenu, 30000)

    // refresh when tab regains focus
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadMenu()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [apiReady])

  const categories = useMemo(() => ['All', ...Array.from(new Set(
    menuItems.map(i => i.category)))], [menuItems])
  const filtered = useMemo(() => menuItems.filter(i => {
    const matchesCategory = category === 'All' || i.category === category
    const matchesQuery = i.name.toLowerCase().includes(query.trim().toLowerCase())
    return matchesCategory && matchesQuery
  }), [category, query, menuItems])

  function openOptions(item) {
    setOptionsOpenFor(item)
    setOptTemperature('Hot')
    setOptSweetness('Normal')
    setOptMilk('Regular')
  }

  function addLineToCart(item, options) {
    const baseInr = Math.round(item.price * INR_PER_USD)
    const inr = baseInr + computeAddonInr(options)
    setCart(prev => {
      const idx = prev.findIndex(l => l.id === item.id && l.options.temperature === options.temperature && l.options.sweetness === options.sweetness && l.options.milk === options.milk)
      if (idx !== -1) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: (next[idx].qty || 1) + 1 }
        return next
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, inr, qty: 1, options }]
    })
  }

  const { totalItems, totalInr, cartItems } = useMemo(() => {
    let itemCount = 0
    let total = 0
    const cartItemsArr = cart.map(l => {
      itemCount += l.qty || 1
      total += (l.inr) * (l.qty || 1)
      return l
    })
    return { totalItems: itemCount, totalInr: total, cartItems: cartItemsArr }
  }, [cart])

  const [showCheckout, setShowCheckout] = useState(false)

  return (
    <section>
      <h2>Our Menu</h2>
      <div className="menu-toolbar">
        <input
          placeholder="Search drinks & pastries..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            padding: '0.6rem 0.8rem',
            borderRadius: '0.5rem',
            outline: 'none',
            flex: '1 1 220px'
          }}
        />
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              background: category === c ? 'var(--accent)' : undefined,
              borderColor: category === c ? 'transparent' : undefined
            }}
          >{c}</button>
        ))}
        {apiReady && (
          <button onClick={async () => {
            try {
              setLoadingMenu(true)
              const data = await fetchMenu()
              if (Array.isArray(data)) setMenuItems(data)
            } finally {
              setLoadingMenu(false)
            }
          }}>Refresh</button>
        )}
      </div>

      <div className="menu-grid">
        {filtered.length === 0 && (
          <div style={{gridColumn:'1/-1', opacity:0.8}}>
            {loadingMenu ? 'Loading menu…' : 'No items match your filters.'}
          </div>
        )}
        {filtered.map(item => (
          <div className="card menu-item" key={item.id}>
            <img src={item.img} alt={item.name} loading="lazy" />
            <h3>{item.name}</h3>
            <div className="price">{INR.format(Math.round(item.price * INR_PER_USD))} • {item.category}</div>
            <button onClick={() => openOptions(item)}>Add to Cart</button>
          </div>
        ))}
      </div>

      {totalItems > 0 && (
        <div className="cart-bar">
          <div><strong>{totalItems}</strong> item{totalItems>1?'s':''}</div>
          <div><strong>{INR.format(totalInr)}</strong></div>
          <div style={{display:'flex', gap:'0.5rem'}}>
            <button onClick={() => setCart([])}>Clear</button>
            <button style={{ background: 'var(--accent)' }} onClick={() => setShowCheckout(true)} disabled={loadingMenu}>{loadingMenu ? 'Loading…' : 'Checkout'}</button>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowCheckout(false)} />
          <div className="modal-content card">
            <h3>Your Order</h3>
            <div className="grid" style={{gridTemplateColumns:'1.2fr 1fr auto 1fr auto 1fr'}}>
              {cartItems.map((ci, idx) => (
                <>
                  <div>{ci.name}</div>
                  <div style={{opacity:0.8}}>{ci.options.temperature} • {ci.options.sweetness} • {ci.options.milk}</div>
                  <div className="price">{INR.format(ci.inr)}</div>
                  <div className="qty" style={{display:'flex',gap:'0.4rem',alignItems:'center'}}>
                    <button aria-label="Decrease" onClick={() => {
                      setCart(prev => {
                        const next = [...prev]
                        const q = (next[idx].qty || 1) - 1
                        if (q <= 0) {
                          next.splice(idx, 1)
                        } else {
                          next[idx] = { ...next[idx], qty: q }
                        }
                        return next
                      })
                    }}>-</button>
                    <span>{ci.qty}</span>
                    <button aria-label="Increase" onClick={() => {
                      setCart(prev => {
                        const next = [...prev]
                        next[idx] = { ...next[idx], qty: (next[idx].qty || 1) + 1 }
                        return next
                      })
                    }}>+</button>
                  </div>
                  <div className="price">{INR.format(ci.inr * ci.qty)}</div>
                  <div style={{display:'flex',gap:'0.4rem',justifyContent:'flex-end'}}>
                    <button onClick={() => {
                      // Open modal prefilled for edit
                      setOptionsOpenFor({ ...ci, isEdit: true, cartIndex: idx })
                      setOptTemperature(ci.options.temperature)
                      setOptSweetness(ci.options.sweetness)
                      setOptMilk(ci.options.milk)
                    }}>Edit</button>
                    <button onClick={() => {
                      setCart(prev => {
                        const next = [...prev]
                        next.splice(idx, 1)
                        return next
                      })
                    }}>Remove</button>
                  </div>
                </>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'1rem'}}>
              <strong>Total</strong>
              <strong>{INR.format(totalInr)}</strong>
            </div>
            <div style={{display:'flex',gap:'0.5rem',marginTop:'1rem',justifyContent:'flex-end'}}>
              <button onClick={() => setShowCheckout(false)}>Close</button>
              <button
                style={{ background: 'var(--accent)' }}
                disabled={placing}
                onClick={async () => {
                  if (!apiReady) {
                    const generatedId = Math.random().toString(36).slice(2, 10)
                    setShowCheckout(false)
                    setCart({})
                    alert(`Order placed! ID: ${generatedId}`)
                    return
                  }
                  try {
                    setPlacing(true)
                    const payload = {
                      items: cartItems.map(ci => ({ id: ci.id, quantity: ci.qty, options: ci.options })),
                      amountInr: totalInr,
                      currency: 'INR',
                    }
                    const response = await createOrder(payload)
                    const orderId = (response && (response.id || response.orderId)) || Math.random().toString(36).slice(2, 10)
                    setShowCheckout(false)
                    setCart([])
                    alert(`Order placed! ID: ${orderId}`)
                  } catch (err) {
                    alert(`Failed to place order. ${err?.message || ''}`)
                  } finally {
                    setPlacing(false)
                  }
                }}
              >{placing ? 'Placing…' : 'Place Order'}</button>
            </div>
          </div>
        </div>
      )}
      {optionsOpenFor && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setOptionsOpenFor(null)} />
          <div className="modal-content card" style={{maxWidth:'520px'}}>
            <h3>Customize {optionsOpenFor.name}</h3>
            <div className="grid" style={{gridTemplateColumns:'1fr 2fr', rowGap:'0.6rem'}}>
              <div><strong>Temperature</strong></div>
              <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                {['Hot','Cold'].map(t => (
                  <button key={t} onClick={() => setOptTemperature(t)} style={{background: optTemperature===t?'var(--accent)':undefined}}>{t} {ADDON_COSTS.temperature[t] ? `(+${INR.format(ADDON_COSTS.temperature[t])})` : ''}</button>
                ))}
              </div>
              <div><strong>Sweetness</strong></div>
              <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                {['No Sugar','Less Sugar','Normal','Extra Sweet'].map(s => (
                  <button key={s} onClick={() => setOptSweetness(s)} style={{background: optSweetness===s?'var(--accent)':undefined}}>{s} {ADDON_COSTS.sweetness[s] ? `(+${INR.format(ADDON_COSTS.sweetness[s])})` : ''}</button>
                ))}
              </div>
              <div><strong>Milk</strong></div>
              <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                {['Regular','Almond','Oat','Soy'].map(m => (
                  <button key={m} onClick={() => setOptMilk(m)} style={{background: optMilk===m?'var(--accent)':undefined}}>{m} {ADDON_COSTS.milk[m] ? `(+${INR.format(ADDON_COSTS.milk[m])})` : ''}</button>
                ))}
              </div>
            </div>
            <div style={{display:'flex', gap:'0.5rem', justifyContent:'flex-end', marginTop:'1rem'}}>
              <button onClick={() => setOptionsOpenFor(null)}>Cancel</button>
              <button style={{background:'var(--accent)'}} onClick={() => {
                const opts = { temperature: optTemperature, sweetness: optSweetness, milk: optMilk }
                if (optionsOpenFor && optionsOpenFor.isEdit) {
                  const baseInr = Math.round(optionsOpenFor.price * INR_PER_USD)
                  const newInr = baseInr + computeAddonInr(opts)
                  setCart(prev => {
                    const next = [...prev]
                    next[optionsOpenFor.cartIndex] = {
                      id: optionsOpenFor.id,
                      name: optionsOpenFor.name,
                      price: optionsOpenFor.price,
                      inr: newInr,
                      qty: optionsOpenFor.qty,
                      options: opts,
                    }
                    return next
                  })
                } else {
                  addLineToCart(optionsOpenFor, opts)
                }
                setOptionsOpenFor(null)
              }}>{optionsOpenFor && optionsOpenFor.isEdit ? 'Update' : 'Add'} ({INR.format(Math.round(optionsOpenFor.price * INR_PER_USD) + computeAddonInr({ temperature: optTemperature, sweetness: optSweetness, milk: optMilk }))})</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}


