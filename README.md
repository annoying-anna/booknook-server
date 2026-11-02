# BookNook Server API

Express.js and MongoDB Atlas backend service powering **BookNook – An Online Community Library**.

## 🚀 Live API URL
- **Production API**: `https://booknook-server-ashy.vercel.app`
- **Local Development**: `http://localhost:5000`

---

## 🔒 Authentication & Authorization
- **BetterAuth JWT Verification with `jose`**: Protected routes verify JWT tokens issued by BetterAuth using `jose` and remote JSON Web Key Sets (JWKS) fetched from `<CLIENT_URL>/api/auth/jwks`.
- **Identity Enforcement**: The user identity (email) is strictly parsed and verified from the cryptographically signed JWT token (`req.user.email`), never trusted from the client request body.
- **Resource Ownership**:
  - `PATCH /books/:id` and `DELETE /books/:id`: Only the user who originally created the book (`book.userEmail === token.email`) is allowed to update or delete it; otherwise returns HTTP 403 Forbidden.
  - `DELETE /borrows/:id`: Only the borrower (`borrow.userEmail === token.email`) is allowed to return the book; otherwise returns HTTP 403 Forbidden.

---

## 📋 API Route Table (All 8 Core Routes)

| # | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| 1 | `GET` | `/books` | **Public** | Browse catalog. Supports `?sort=newest&limit=&category=&search=` |
| 2 | `GET` | `/books/:id` | **Protected (JWT)** | Fetch single book details by ObjectId |
| 3 | `POST` | `/books` | **Protected (JWT)** | Create a book. Sets `availableCopies = totalCopies`, userEmail from token |
| 4 | `PATCH` | `/books/:id` | **Protected (JWT)** | Update book details (Owner only, 403 otherwise) |
| 5 | `DELETE` | `/books/:id` | **Protected (JWT)** | Delete book from catalog (Owner only, 403 otherwise) |
| 6 | `POST` | `/borrows` | **Protected (JWT)** | Atomic borrow: checks stock, verifies unique constraint, decrements copies |
| 7 | `GET` | `/borrows` | **Protected (JWT)** | Get all borrows belonging to the authenticated user |
| 8 | `DELETE` | `/borrows/:id` | **Protected (JWT)** | Return a book: deletes borrow record, increments copies (Owner only) |

---

## ⚡ Atomic Borrowing & Stock Guarantee
The `POST /borrows` endpoint prevents race conditions and ensures data integrity:
1. Validates that the user has not already borrowed this book via the compound unique index on `{ bookId: 1, userEmail: 1 }`. If already borrowed, returns **HTTP 409 Conflict**.
2. Executes an atomic `findOneAndUpdate` with query `{ availableCopies: { $gt: 0 } }` and update `{ $inc: { availableCopies: -1 } }`. If no copies remain, returns **HTTP 400 Bad Request ("No copies left")**.
3. Inserts the borrow record `{ bookId, bookTitle, bookImage, userEmail, borrowDate, returnDate }`. In the event of a duplicate key error (code 11000), automatically restores the copy with `$inc: { availableCopies: 1 }` and returns **HTTP 409 Conflict**.

---

## ⚙️ Environment Variables
Create a `.env` file (see `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/booknook
CLIENT_URL=https://booknook-client-tau.vercel.app
```

---

## 🛠️ Local Setup
```bash
npm install
node seed.js    # Seed sample books with availableCopies
npm start       # Starts server on http://localhost:5000
```
