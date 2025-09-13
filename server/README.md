# Cafe Backend

Minimal Express + MongoDB backend for the Cafe app.

## Setup

1. Create a `.env` file in `server/` with:

```
MONGODB_URI=your-mongodb-connection-string
MONGODB_DB=cafe
PORT=5174
```

Note: If you use an SRV connection string (`mongodb+srv://`), do not include a port in the host. Example (correct):

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxxx.mongodb.net/?retryWrites=true&w=majority
```

Incorrect (will fail):

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxxx.mongodb.net:27017/?retryWrites=true&w=majority
```

2. Install and run:

```
cd server
npm install
npm run dev
```

The API will run at `http://localhost:5174`.

## Endpoints

- GET `/menu` → returns menu items
- POST `/orders` → body: `{ items: [{id, quantity}], amountInr, currency }`; returns `{ id }`


