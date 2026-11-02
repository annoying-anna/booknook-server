# ⚡ BookNook Server API

[![API Status](https://img.shields.io/badge/API-Live%20on%20Vercel-emerald?style=for-the-badge&logo=vercel)](https://booknook-server-ashy.vercel.app/books)
[![Node.js](https://img.shields.io/badge/Node.js-Express%20v4-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-forestgreen?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/cloud/atlas)
[![jose JWKS](https://img.shields.io/badge/Auth-jose%20Remote%20JWKS-blueviolet?style=for-the-badge)](https://github.com/panva/jose)

High-performance Express.js and MongoDB Atlas backend service powering **BookNook – An Online Community Library**.

---

## 🚀 Live Endpoints
- **Live Server Root**: [https://booknook-server-ashy.vercel.app](https://booknook-server-ashy.vercel.app)
- **Books Catalog Endpoint**: [https://booknook-server-ashy.vercel.app/books](https://booknook-server-ashy.vercel.app/books)
- **Production Client App**: [https://booknook-client-tau.vercel.app/](https://booknook-client-tau.vercel.app/)

---

## 🔒 Authentication & Security Architecture
- **BetterAuth JWT Verification with `jose`**: Protected routes verify JWT tokens issued by BetterAuth using `jose` and remote JSON Web Key Sets (JWKS) fetched dynamically from `<CLIENT_URL>/api/auth/jwks`.
- **Cryptographic User Identification**: User identity (`userEmail`) is extracted directly from the verified token claims (`req.user.email`), strictly prohibiting trust in arbitrary client-provided request bodies.
- **Strict Ownership Checks**:
  - `PATCH /books/:id` & `DELETE /books/:id`: Only the creator of the book (`book.userEmail === token.email`) can edit or delete the listing; otherwise responds with **HTTP 403 Forbidden**.
  - `DELETE /borrows/:id`: Only the borrower (`borrow.userEmail === token.email`) can return the borrowed volume; otherwise responds with **HTTP 403 Forbidden**.

---

## 📋 Complete API Route Table (All 8 Core Routes)

| # | Method | Endpoint | Access Level | Description |
|---|---|---|---|---|
| 1 | `GET` | `/books` | **Public** | Browse collection. Supports `?category=`, `?search=`, and `?sort=newest&limit=6` |
| 2 | `GET` | `/books/:id` | **Protected (JWT)** | Fetch single book details by MongoDB ObjectId |
| 3 | `POST` | `/books` | **Protected (JWT)** | Create a new book. Sets `availableCopies = totalCopies`, user from token |
| 4 | `PATCH` | `/books/:id` | **Protected (JWT)** | Update book details (Owner only, 403 otherwise) |
| 5 | `DELETE` | `/books/:id` | **Protected (JWT)** | Delete book from catalog (Owner only, 403 otherwise) |
| 6 | `POST` | `/borrows` | **Protected (JWT)** | Atomic borrow: checks stock, verifies unique constraint, decrements stock |
| 7 | `GET` | `/borrows` | **Protected (JWT)** | Get all borrows belonging to the authenticated user |
| 8 | `DELETE` | `/borrows/:id` | **Protected (JWT)** | Return a book: deletes borrow record, increments copies (Owner only) |

---

## ⚡ Concurrency-Safe Atomic Borrowing & Stock Guarantee
The `POST /borrows` endpoint prevents race conditions and guarantees inventory consistency:
1. Validates that the member has not already borrowed the volume via the compound unique index on `{ bookId: 1, userEmail: 1 }`. If already borrowed, immediately returns **HTTP 409 Conflict**.
2. Executes an atomic `findOneAndUpdate` with query `{ availableCopies: { $gt: 0 } }` and update `{ $inc: { availableCopies: -1 } }`. If no physical copies remain, returns **HTTP 400 Bad Request ("No copies left")**.
3. Inserts the borrow record `{ bookId, bookTitle, bookImage, userEmail, borrowDate, returnDate }`. In the event of a concurrent duplicate key conflict (code 11000), it automatically restores the decremented inventory with `$inc: { availableCopies: 1 }` and responds with **HTTP 409 Conflict**.

---

## ⚙️ Environment Variables
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/booknook
CLIENT_URL=https://booknook-client-tau.vercel.app
```

---

## 🚀 Running Locally
```bash
npm install
npm run dev
```
Accessible at `http://localhost:5000`.
