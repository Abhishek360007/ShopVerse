<p align="center"><img src="UI/public/logo192.png" alt="ShopVerse logo" width="96" /></p>

# 🛒 ShopVerse — Full-Stack E-Commerce Platform

[![CI](https://github.com/Abhishek360007/ShopVerse/actions/workflows/ci.yml/badge.svg)](https://github.com/Abhishek360007/ShopVerse/actions/workflows/ci.yml)

ShopVerse is a full-stack e-commerce web application built with **React.js** on the front end and **Spring Boot** on the back end. It covers the full online shopping flow: browsing six categories (Electronics, Fashion, Home & Kitchen, Books, Sports and Beauty), searching, managing a cart, signing in, checking out with a card (Stripe) or cash on delivery, and tracking orders. Prices are in Indian Rupees (₹). It also has an admin panel for managing products and categories.

## ✨ Features

- 🌙 Dark, responsive storefront with a purple–pink theme
- 🔎 Product search plus category pages with type filters
- 📦 Product pages with size options, stock checks and similar products
- 🛍️ Cart that merges repeat items and respects available stock
- 🔐 Sign-up (optional email verification), login, JWT authentication and Google OAuth2 sign-in
- 💳 Checkout with saved addresses, Stripe card payments or cash on delivery
- 🧾 Order totals calculated on the server from catalog prices
- 📜 Order history with a status timeline, cancellation and account settings
- 📊 Admin dashboard with revenue and order stats
- 🚚 Admin order management: filter orders, view details and move them through Pending → In progress → Shipped → Delivered (or cancel)
- 📦 Stock goes down when an order is placed and back up when it is cancelled
- 🛠️ Admin panel (react-admin) for products and categories, restricted to admins
- 🌱 Starter catalog loaded automatically on a fresh database
- 📖 API documentation through Swagger / OpenAPI
- 🐳 One-command setup with Docker Compose
- ✅ Unit tests and GitHub Actions CI for the backend and frontend

## 🛠️ Tech Stack

| Layer          | Technologies                                                   |
| -------------- | -------------------------------------------------------------- |
| Frontend       | React 18, Redux Toolkit, React Router, Tailwind CSS, Axios     |
| Admin          | react-admin                                                    |
| Backend        | Java 25, Spring Boot 4, Spring Security, Spring Data JPA       |
| Database       | PostgreSQL                                                     |
| Authentication | JWT, Google OAuth2                                             |
| Payments       | Stripe                                                         |
| Build Tools    | Maven, npm                                                     |
| DevOps         | Docker, Docker Compose, Nginx, GitHub Actions                  |

## 📁 Project Structure

```
ShopVerse/
├── backend/                         # Spring Boot REST API (package com.shopverse)
│   └── src/main/java/com/shopverse/
│       ├── auth/                    # JWT, OAuth2, registration and user details
│       ├── controllers/             # Product, category, order, address and file upload APIs
│       ├── entities/                # JPA entities
│       ├── services/                # Business logic
│       └── ...
├── UI/                              # React front end
│   └── src/
│       ├── api/                     # API clients
│       ├── components/              # Reusable UI components
│       ├── pages/                   # Pages and the admin panel
│       └── store/                   # Redux store
├── .github/workflows/ci.yml         # CI pipeline
├── docker-compose.yml               # Full stack: PostgreSQL + API + UI
└── ShopVerse.postman_collection.json
```

## 🚀 Getting Started

### Option A: Docker (quickest)

```bash
cp backend/.env.example backend/.env   # then fill in your keys
docker compose up --build
```

| Service  | URL                                           |
| -------- | --------------------------------------------- |
| Frontend | http://localhost:3000                         |
| API      | http://localhost:8080                         |
| Swagger  | http://localhost:8080/swagger-ui/index.html   |

PostgreSQL runs inside Docker, so you don't need it installed locally.

### Option B: Run locally

#### Prerequisites

- Java 25+
- Node.js 18+ and npm
- PostgreSQL

#### 1. Backend

Set these environment variables. `backend/.env.example` lists them:

| Variable                       | Description                          |
| ------------------------------ | ------------------------------------ |
| `DB_HOST`                      | PostgreSQL host                      |
| `DB_PORT` / `DB_NAME`          | Port (default `5432`) and database name (default `shopverse`) |
| `DB_USER` / `DB_PASSWORD`      | Database credentials                 |
| `MAIL_USERNAME`                | Gmail address used to send emails    |
| `MAIL_PASSWORD`                | Gmail app password                   |
| `JWT_KEY`                      | Base64 secret for signing JWTs (`openssl rand -base64 48`) |
| `GOOGLE_OAUTH2_CLIENT_ID`      | Google OAuth2 client ID              |
| `GOOGLE_OAUTH2_CLIENT_SECRET`  | Google OAuth2 client secret          |
| `STRIPE_SECRET`                | Stripe secret key                    |
| `FILE_ZONE`, `CDN_KEY`, `CDN_HOST` | Storage settings for file uploads |
| `FRONTEND_URL`                 | Frontend URL for OAuth2 redirects (default `http://localhost:3000`) |
| `ADMIN_EMAIL`                  | The account with this email gets admin access |
| `CORS_ALLOWED_ORIGINS`         | Sites allowed to call the API, comma-separated (default: `FRONTEND_URL`) |
| `SEED_DATA`                    | Load the starter catalog into an empty database (default `true`) |
| `EMAIL_VERIFICATION`           | Require an email code on sign-up (default `true`; set `false` if no mail server) |

Then run:

```bash
cd backend
./mvnw spring-boot:run
```

The API runs at `http://localhost:8080`. Swagger UI is at `http://localhost:8080/swagger-ui/index.html`.

#### Admin access

Set `ADMIN_EMAIL` to your email, then sign up with that email (or restart the backend if the account already exists). Your account page will then show **Manage store**, which opens the admin panel at `/admin`. The admin panel has a sales dashboard, an **Orders** page for updating order status, and pages for products and categories.

> Without `REACT_APP_STRIPE_KEY` the card option is turned off at checkout and customers can still pay with cash on delivery.

#### 2. Frontend

Optionally create `UI/.env` from `UI/.env.example`:

| Variable                  | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `REACT_APP_API_BASE_URL`  | Backend URL (default `http://localhost:8080`)  |
| `REACT_APP_STRIPE_KEY`    | Stripe publishable key                         |
| `REACT_APP_CDN_URL`       | Base URL for uploaded product images           |
| `REACT_APP_GOOGLE_LOGIN`  | Set to `true` to show “Continue with Google”   |

```bash
cd UI
npm install
npm start
```

The app opens at `http://localhost:3000`.

## ☁️ Deploy to Render

The repo includes a [Render Blueprint](render.yaml) that creates the database, the API and the storefront.

1. Sign in at [render.com](https://render.com) with your GitHub account.
2. Click **New → Blueprint** and select the **ShopVerse** repository.
3. When asked for `ADMIN_EMAIL`, enter the email you will use as the store admin, then click **Apply**.
4. Wait for all three services to go live (the first build takes about 10 minutes).
5. Open the **shopverse-web** URL, sign up with your `ADMIN_EMAIL`, and you'll see **Manage store** on your account page.

On the free plan the API sleeps after 15 minutes without visitors, so the first page load after a break can take about a minute. Free Render databases expire after 30 days unless you upgrade.

Card payments, Google sign-in, emails and image uploads are off by default. To turn one on, replace its `not-configured` values in the **shopverse-api → Environment** settings (for Google sign-in, also set `REACT_APP_GOOGLE_LOGIN=true` on **shopverse-web**; for card payments, set `REACT_APP_STRIPE_KEY`).

## 🧪 Testing

```bash
cd backend && ./mvnw test                  # backend unit tests
cd UI && npm test -- --watchAll=false      # frontend unit tests
```

GitHub Actions runs both test suites and a production build on every push and pull request to `main`.

### API Testing

Import `ShopVerse.postman_collection.json` into Postman to try the API endpoints.

## 🙏 Acknowledgements

ShopVerse builds on the open [ShopEase tutorial project](https://github.com/pardeep16/shopEase) by Pardeep Kumar ([TheCodeReveal](https://www.youtube.com/@thecodereveal)).

## 👤 Author

**Abhishek Raj** — [GitHub @Abhishek360007](https://github.com/Abhishek360007)
