Café Ordering App

This is a full-stack café ordering application built with React (Vite) on the frontend and Express + MongoDB (Mongoose) on the backend. The project includes essential features like user authentication (signup/login with JWT and bcrypt), menu browsing with search and category filter, an add-to-cart system with item preferences (temperature, sweetness, milk) that dynamically update the price, and a checkout flow with edit/remove options before placing an order. Authenticated users can view their order history, while the contact form allows message submissions stored in MongoDB.

The frontend uses React Router for navigation, Context API for managing authentication, and a responsive coffee-themed UI. The backend is powered by Express with REST APIs for authentication, menu retrieval, order creation/listing, and contact submissions. JWT-secured routes ensure protected access, and all passwords are hashed for security. A seed script is included to populate sample menu items.

To run the project, start the frontend with npm run dev (default at http://localhost:5173
) and the backend with npm run dev (default at http://localhost:3001
) after configuring .env with MONGODB_URI, MONGODB_DB, JWT_SECRET, and PORT. Optional seeding of menu data can be done with npm run seed.

This project was built as a learning experience to practice full-stack development, focusing on authentication, state management, secure APIs, and building a smooth user flow from menu selection to order completion.
