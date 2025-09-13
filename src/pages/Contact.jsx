import { useMemo, useState } from 'react'
import { submitContactForm } from '../lib/api'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEmail = useMemo(() => /.+@.+\..+/.test(email), [email])
  const canSubmit = name.trim() && isEmail && message.trim().length >= 10

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit || loading) return
    
    setLoading(true)
    setError('')
    
    try {
      const result = await submitContactForm({
        name: name.trim(),
        email: email.trim(),
        message: message.trim()
      })
      
      if (result.success) {
        setSubmitted(true)
        setName('')
        setEmail('')
        setMessage('')
        setTimeout(() => setSubmitted(false), 5000)
      } else {
        setError(result.message || 'Failed to send message. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="centered">
      <h2>Contact Us</h2>
      <div className="grid" style={{maxWidth:'900px', margin:'0 auto', gridTemplateColumns:'1fr 1.2fr'}}>
        <div className="card">
          <p>123 Brew Lane, Roast City</p>
          <p>Email: hello@cafearoma.example</p>
          <p>Hours: Mon–Sun 7:00–20:00</p>
        </div>
        <form className="card" onSubmit={onSubmit} style={{textAlign:'left'}}>
          {error && <div className="error-message" style={{marginBottom:'1rem'}}>{error}</div>}
          
          <label>Name<br />
            <input 
              value={name} 
              onChange={e=>setName(e.target.value)} 
              required 
              disabled={loading}
              style={{width:'80%',padding:'0.85rem',borderRadius:'0.5rem',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)'}} 
            />
          </label>
          <br />
          <label>Email<br />
            <input 
              type="email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required 
              disabled={loading}
              style={{width:'80%',padding:'0.85rem',borderRadius:'0.5rem',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)'}} 
            />
          </label>
          <br />
          <label>Message<br />
            <textarea 
              rows={6} 
              value={message} 
              onChange={e=>setMessage(e.target.value)} 
              required 
              disabled={loading}
              style={{width:'80%',padding:'0.85rem',borderRadius:'0.5rem',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)'}} 
            />
          </label>
          <br />
          <button 
            type="submit"
            disabled={!canSubmit || loading} 
            style={{opacity:(canSubmit && !loading)?1:0.6}}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
          
          {submitted && <div style={{marginTop:'0.5rem',color:'var(--accent)',fontWeight:'500'}}>Thanks! We'll get back to you soon.</div>}
        </form>
      </div>
    </section>
  )
}


