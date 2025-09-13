const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3001'

async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  if (!BASE_URL) throw new Error('API base URL not configured')
  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  })
  
  if (!res.ok) {
    let errorMessage = `Request failed: ${res.status}`
    try {
      const errorData = await res.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      const text = await res.text().catch(() => '')
      errorMessage = text || errorMessage
    }
    throw new Error(errorMessage)
  }
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}

export async function fetchMenu() {
  return request('/menu')
}

export async function createOrder(payload) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function isApiConfigured() {
  return Boolean(BASE_URL)
}

// Authentication functions
export async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function signup(name, email, password) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export async function getCurrentUser(token) {
  return request('/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

export async function fetchOrders() {
  return request('/orders')
}

export async function submitContactForm(data) {
  return request('/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}



