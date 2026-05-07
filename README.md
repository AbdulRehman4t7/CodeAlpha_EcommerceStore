# CodeAlpha E-commerce Store

A complete full-stack e-commerce web application built with HTML, CSS, Vanilla JavaScript, Node.js, Express, MongoDB, Mongoose, JWT authentication, bcrypt password hashing, and Multer product image uploads.

## Features

- Responsive storefront with home, products, product detail, cart, checkout, auth, dashboard, and admin pages.
- JWT authentication with protected user routes and role-based admin access.
- Product search, category filtering, price filtering, pagination, and sorting.
- Persistent user cart and order history.
- Admin product CRUD with image upload and order status management.
- Backend validation, centralized error handling, CORS, dotenv config, and MongoDB seed data.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create an environment file:

```bash
copy .env.example .env
```

3. Start MongoDB locally, then seed the database:

```bash
npm run seed
```

4. Run the app:

```bash
npm run dev
```

Open `http://localhost:5000`.

## Demo Accounts

- Admin: `admin@codealpha.dev` / `Admin123!`
- User: `user@codealpha.dev` / `User123!`

## API Docs

All protected routes require:

```http
Authorization: Bearer <jwt>
```

### Auth

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/profile` | User | Get current profile |
| PUT | `/api/auth/profile` | User | Update profile |
| PUT | `/api/auth/password` | User | Change password |

### Products

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/products?search=&category=&minPrice=&maxPrice=&sort=&page=` | Public | List products |
| GET | `/api/products/:id` | Public | Product detail |
| POST | `/api/products` | Admin | Create product with optional `images` files |
| PUT | `/api/products/:id` | Admin | Update product with optional `images` files |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Cart

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/cart` | User | Get cart |
| POST | `/api/cart/add` | User | Add item `{ productId, qty }` |
| PUT | `/api/cart/update` | User | Update quantity `{ productId, qty }` |
| DELETE | `/api/cart/remove/:productId` | User | Remove item |

### Orders

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/orders` | User | Place order |
| GET | `/api/orders/myorders` | User | Current user's orders |
| GET | `/api/orders` | Admin | All orders |
| PUT | `/api/orders/:id/status` | Admin | Update order status `{ status }` |

## Screenshots

Run the app and capture:

- Home page: `client/index.html`
- Product listing: `client/products.html`
- Admin panel: `client/admin.html`

## Folder Structure

```text
/client
  /css
  /js
  /uploads
/server
  /controllers
  /middleware
  /models
  /routes
  seed.js
  server.js
.env.example
package.json
README.md
```
