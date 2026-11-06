# 🛒 ShopVerse — Full-Stack E-Commerce Platform

ShopVerse is a full-stack e-commerce web application built with **React.js** on the front end and **Spring Boot** on the back end. It covers the full online shopping flow: browsing products, filtering by category, managing a cart, signing in, checking out, paying with Stripe and tracking orders. It also has an admin panel for managing products and categories.

## ✨ Features

- 🏠 Home page with a hero section, new arrivals and category sections
- 🔎 Product listing with category, price, color and size filters
- 📦 Product detail pages with variants (color and size)
- 🛍️ Shopping cart backed by Redux state
- 🔐 Sign-up with email verification, login, JWT authentication and Google OAuth2 sign-in
- 💳 Checkout with address management and Stripe payments
- 📜 Order history and account settings
- 🛠️ Admin panel (react-admin) for product, category and image management
- 📖 API documentation through Swagger / OpenAPI

## 🛠️ Tech Stack

| Layer          | Technologies                                                   |
| -------------- | -------------------------------------------------------------- |
| Frontend       | React 18, Redux Toolkit, React Router, Tailwind CSS, Axios     |
| Admin          | react-admin                                                    |
| Backend        | Java 17, Spring Boot 3, Spring Security, Spring Data JPA       |
| Database       | PostgreSQL                                                     |
| Authentication | JWT, Google OAuth2                                             |
| Payments       | Stripe                                                         |
| Build Tools    | Maven, npm                                                     |

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
└── ShopVerse.postman_collection.json
```

## 🚀 Getting Started

### Prerequisites

- Java 17+
- Node.js 18+ and npm
- PostgreSQL

### 1. Backend

Set these environment variables. `backend/.env.example` lists them:

| Variable                       | Description                          |
| ------------------------------ | ------------------------------------ |
| `DB_HOST`                      | PostgreSQL host                      |
| `DB_USER` / `DB_PASSWORD`      | Database credentials                 |
| `MAIL_USERNAME`                | Gmail address used to send emails    |
| `MAIL_PASSWORD`                | Gmail app password                   |
| `JWT_KEY`                      | Secret key for signing JWTs          |
| `GOOGLE_OAUTH2_CLIENT_ID`      | Google OAuth2 client ID              |
| `GOOGLE_OAUTH2_CLIENT_SECRET`  | Google OAuth2 client secret          |
| `STRIPE_SECRET`                | Stripe secret key                    |
| `FILE_ZONE`, `CDN_KEY`, `CDN_HOST` | Storage settings for file uploads |

Then run:

```bash
cd backend
./mvnw spring-boot:run
```

The API runs at `http://localhost:8080`. Swagger UI is at `http://localhost:8080/swagger-ui/index.html`.

### 2. Frontend

```bash
cd UI
npm install
npm start
```

The app opens at `http://localhost:3000`.

### 3. API Testing

Import `ShopVerse.postman_collection.json` into Postman to try the API endpoints.

## 🙏 Acknowledgements

ShopVerse builds on the open [ShopEase tutorial project](https://github.com/pardeep16/shopEase) by Pardeep Kumar ([TheCodeReveal](https://www.youtube.com/@thecodereveal)).

## 👤 Author

**Abhishek Raj** — [GitHub @Abhishek360007](https://github.com/Abhishek360007)
