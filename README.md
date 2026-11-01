# BookNook Server API

Backend RESTful API service for **BookNook – A Small Online Library**, built with Express.js, MongoDB Atlas, and JSON Web Token (JWT) authentication.

## 🚀 Live Server URL
- **API Base URL**: `https://booknook-server.vercel.app` (or local `http://localhost:5000`)

## ✨ Key Features
- **JWT Authentication**: Secure token generation via `/jwt` and middleware verification (`verifyToken`) on all protected mutations.
- **Full Books CRUD**: Public endpoints to browse books, filter by category or creator email, read book details, and authenticated endpoints to add, update, and delete books.
- **Smart Borrowing System**: Tracks active borrows, prevents double-borrowing of the same book simultaneously, and validates stock availability.
- **Atomic Inventory Updates**: Utilizes MongoDB `$inc` operator to decrement `totalCopies` on borrow and automatically restore copies on return.
- **RESTful Architecture**: Clean HTTP status codes, structured error handling, CORS headers enabled, and modular deployment ready for Vercel/Render.

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas with native MongoDB driver v6
- **Security**: JSON Web Token (jsonwebtoken), CORS, dotenv
- **Deployment**: Vercel Serverless Function (`vercel.json`)

## 📋 API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | Server health check & API directory |
| `POST` | `/jwt` | Public | Generates a 7-day signed JWT token |
| `GET` | `/books` | Public | Get all books (supports `?email=`, `?category=`, `?limit=`) |
| `GET` | `/books/new-arrivals` | Public | Get latest 6 books sorted by newest first |
| `GET` | `/books/:id` | Public | Get single book details by ObjectId |
| `POST` | `/books` | Protected (JWT) | Add a new book to the library |
| `PATCH` | `/books/:id` | Protected (JWT) | Update existing book information |
| `DELETE` | `/books/:id` | Protected (JWT) | Remove a book from the library |
| `POST` | `/borrows` | Protected (JWT) | Borrow a book (checks copies & prevents double borrow) |
| `GET` | `/borrows` | Protected (JWT) | Get borrows belonging to the authenticated user |
| `DELETE` | `/borrows/:id` | Protected (JWT) | Return a book & increment available copies |

## ⚙️ Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@annoying.208jf6p.mongodb.net/booknook
JWT_SECRET=your_jwt_secret_key
```

## 💻 Local Setup & Development
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Populate sample books (optional):
   ```bash
   node seed.js
   ```
4. Run development server:
   ```bash
   npm run dev
   # or
   npm start
   ```
5. Server will start at `http://localhost:5000`.
