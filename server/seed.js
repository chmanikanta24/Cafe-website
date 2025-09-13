import 'dotenv/config'
import mongoose from 'mongoose'

const mongoUri = process.env.MONGODB_URI || ''
if (!mongoUri) {
  console.error('MONGODB_URI not set. Create server/.env with MONGODB_URI=...')
  process.exit(1)
}

const mongooseOptions = { dbName: process.env.MONGODB_DB || 'cafe' }

const MenuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  price: Number,
  category: String,
  img: String,
}, { timestamps: true })

const menuCollection = process.env.MONGODB_MENU_COLLECTION || 'menuitems'
const MenuItem = mongoose.model('MenuItem', MenuItemSchema, menuCollection)

function toSlug(str = '') {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const seedItems = [
  { name: 'Espresso', price: 120, category: 'Beverage', img: 'https://picsum.photos/seed/espresso/400/300' },
  { name: 'Cappuccino', price: 180, category: 'Beverage', img: 'https://picsum.photos/seed/cappuccino/400/300' },
  { name: 'Latte', price: 200, category: 'Beverage', img: 'https://picsum.photos/seed/latte/400/300' },
  { name: 'Americano', price: 150, category: 'Beverage', img: 'https://picsum.photos/seed/americano/400/300' },
  { name: 'Mocha', price: 230, category: 'Beverage', img: 'https://picsum.photos/seed/mocha/400/300' },
  { name: 'Cold Brew', price: 220, category: 'Beverage', img: 'https://picsum.photos/seed/coldbrew/400/300' },
  { name: 'Matcha Latte', price: 250, category: 'Beverage', img: 'https://picsum.photos/seed/matcha/400/300' },
  { name: 'Butter Croissant', price: 90, category: 'Bakery', img: 'https://picsum.photos/seed/croissant/400/300' },
  { name: 'Chocolate Chip Cookie', price: 70, category: 'Bakery', img: 'https://picsum.photos/seed/cookie/400/300' },
  { name: 'Blueberry Muffin', price: 100, category: 'Bakery', img: 'https://picsum.photos/seed/muffin/400/300' },
]

async function run() {
  try {
    await mongoose.connect(mongoUri, mongooseOptions)

    const ops = seedItems.map(it => {
      const derivedId = it.id || toSlug(it.name)
      const doc = { id: derivedId, name: it.name, price: it.price, category: it.category, img: it.img }
      return { updateOne: { filter: { id: derivedId }, update: { $set: doc }, upsert: true } }
    })

    const result = await MenuItem.bulkWrite(ops, { ordered: false })
    const upserted = result.upsertedCount ?? (Array.isArray(result.upsertedIds) ? result.upsertedIds.length : 0)
    console.log('Seeding completed:', { matched: result.matchedCount ?? 0, modified: result.modifiedCount ?? 0, upserted })
  } catch (err) {
    console.error('Seeding failed:', err)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect().catch(() => {})
  }
}

run()


