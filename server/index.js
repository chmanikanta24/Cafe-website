import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app = express()
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}))
app.use(express.json())

const mongoUri = process.env.MONGODB_URI || ''
if (!mongoUri) {
  console.warn('MONGODB_URI not set. Set it in .env')
}
// Sanitize SRV URIs: remove any port from host portion (mongodb+srv does not allow ports)
function sanitizeSrvUri(uri) {
  if (!uri.startsWith('mongodb+srv://')) return uri
  const scheme = 'mongodb+srv://'
  const afterScheme = uri.slice(scheme.length)
  const slashIndex = afterScheme.indexOf('/')
  const authority = slashIndex === -1 ? afterScheme : afterScheme.slice(0, slashIndex)
  const rest = slashIndex === -1 ? '' : afterScheme.slice(slashIndex)
  const atIndex = authority.lastIndexOf('@')
  const authPart = atIndex !== -1 ? authority.slice(0, atIndex + 1) : ''
  const hostsPart = atIndex !== -1 ? authority.slice(atIndex + 1) : authority
  const sanitizedHosts = hostsPart
    .split(',')
    .map(h => h.replace(/:\d+/g, ''))
    .join(',')
  const sanitized = scheme + authPart + sanitizedHosts + rest
  if (sanitized !== uri) {
    console.warn("Warning: Removed port from 'mongodb+srv://' MONGODB_URI host(s). Ports are not allowed for SRV URIs.")
  }
  return sanitized
}

const effectiveMongoUri = sanitizeSrvUri(mongoUri)

// Detect malformed SRV URIs where the '@' between credentials and host is missing
if (effectiveMongoUri.startsWith('mongodb+srv://')) {
  try {
    const parsed = new URL(effectiveMongoUri)
    const hasCreds = Boolean(parsed.username)
    const hostnameIncludesEncodedAt = parsed.hostname.includes('%40')
    if (hasCreds && hostnameIncludesEncodedAt) {
      throw new Error(
        "Invalid MONGODB_URI: It looks like the '@' separator between credentials and host is missing. Format should be 'mongodb+srv://<username>:<password>@<cluster-host>/<db>?options'. Ensure your username/password are URL-encoded, then add '@' before the cluster host."
      )
    }
  } catch (e) {
    if (e instanceof TypeError) {
      // ignore URL parse TypeError; mongoose will throw its own
    } else {
      throw e
    }
  }
}

const mongooseOptions = { dbName: process.env.MONGODB_DB || 'cafe' }
try {
  const url = new URL(effectiveMongoUri)
  const hasAuthSource = url.searchParams.has('authSource')
  if (!hasAuthSource && url.protocol === 'mongodb+srv:') {
    // Atlas users are typically stored in the 'admin' database
    mongooseOptions.authSource = 'admin'
  }
} catch (_) {
  // If URL parsing fails, proceed; driver will surface a helpful error
}

await mongoose.connect(effectiveMongoUri, mongooseOptions)

const MenuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  price: Number,
  category: String,
  img: String,
}, { timestamps: true })

const OrderSchema = new mongoose.Schema({
  items: [{
    id: String,
    quantity: Number,
    options: {
      temperature: { type: String },
      sweetness: { type: String },
      milk: { type: String },
    }
  }],
  amountInr: Number,
  currency: { type: String, default: 'INR' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
}, { timestamps: true })

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'new' }, // new, read, replied
}, { timestamps: true })

const menuCollection = process.env.MONGODB_MENU_COLLECTION || 'menuitems'
const MenuItem = mongoose.model('MenuItem', MenuItemSchema, menuCollection)
const Order = mongoose.model('Order', OrderSchema)
const User = mongoose.model('User', UserSchema)
const Contact = mongoose.model('Contact', ContactSchema)

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Authentication routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Seeding removed: menu items are read directly from the configured MongoDB collection

app.get('/menu', async (_req, res) => {
  const docs = await MenuItem.find().lean()
  const items = (docs || []).map(d => ({
    id: d.id || (d._id ? d._id.toString() : undefined),
    name: d.name,
    price: d.price,
    category: d.category,
    img: d.img,
  }))
  res.json(items)
})

app.post('/orders', authenticateToken, async (req, res) => {
  const { items, amountInr, currency } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items required' })
  }
  // Normalize items to only allow expected fields (id, quantity, options)
  const normalizedItems = items.map((it) => ({
    id: it?.id,
    quantity: Number(it?.quantity) || 1,
    options: it?.options ? {
      temperature: it.options.temperature,
      sweetness: it.options.sweetness,
      milk: it.options.milk,
    } : undefined,
  }))

  const order = await Order.create({
    items: normalizedItems,
    amountInr,
    currency: currency || 'INR',
    userId: req.user.userId
  })
  res.status(201).json({ id: order._id.toString() })
})

app.get('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Contact form endpoints
app.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const contact = await Contact.create({
      name,
      email,
      message
    })

    res.status(201).json({ 
      success: true, 
      message: 'Contact form submitted successfully',
      id: contact._id 
    })
  } catch (error) {
    console.error('Contact form error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all contact messages (for admin purposes)
app.get('/contact', authenticateToken, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 })
    res.json(contacts)
  } catch (error) {
    console.error('Get contacts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all users (for admin purposes)
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})


