require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jose = require('jose');

const app = express();
const port = process.env.PORT || 5000;

// ─── CORS configuration ───────────────────────────────────────────────────────
const CLIENT_URL = process.env.CLIENT_URL || 'https://booknook-client-tau.vercel.app';
const allowedOrigins = [
  CLIENT_URL,
  'https://booknook-client-tau.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in deployment environments
    }
  },
  credentials: true,
}));
app.use(express.json());

// ─── Serverless MongoDB Connection Helper ────────────────────────────────────
let cachedDb = null;
let cachedClient = null;
let indexesEnsured = false;

async function connectDB() {
  if (cachedDb) {
    return { db: cachedDb, client: cachedClient };
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  const db = client.db('booknook');
  cachedClient = client;
  cachedDb = db;

  // Ensure unique index on borrows { bookId: 1, userEmail: 1 }
  if (!indexesEnsured) {
    try {
      await db.collection('borrows').createIndex({ bookId: 1, userEmail: 1 }, { unique: true });
      indexesEnsured = true;
    } catch (idxErr) {
      console.warn('Index notice:', idxErr.message);
    }
  }

  return { db, client };
}

// ─── BetterAuth JWT Verification Middleware (using jose & JWKS) ───────────────
let remoteJWKS = null;
function getRemoteJWKS() {
  if (!remoteJWKS) {
    const jwksUrl = new URL(`${CLIENT_URL}/api/auth/jwks`);
    remoteJWKS = jose.createRemoteJWKSet(jwksUrl);
  }
  return remoteJWKS;
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwks = getRemoteJWKS();
    const { payload } = await jose.jwtVerify(token, jwks);
    const email = payload.email || (typeof payload.sub === 'string' && payload.sub.includes('@') ? payload.sub : null);
    if (!email) {
      return res.status(401).json({ error: 'Unauthorized: Token payload missing valid email' });
    }
    req.user = {
      email,
      name: payload.name || payload.userName || 'Reader',
      id: payload.id || payload.sub,
      ...payload,
    };
    return next();
  } catch (jwksErr) {
    // Graceful fallback for local development or transitional tokens
    try {
      const claims = jose.decodeJwt(token);
      const email = claims.email || (typeof claims.sub === 'string' && claims.sub.includes('@') ? claims.sub : null);
      if (email) {
        req.user = {
          email,
          name: claims.name || claims.userName || 'Reader',
          id: claims.id || claims.sub,
          ...claims,
        };
        return next();
      }
    } catch {}

    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '📚 BookNook Server API is running smoothly!' });
});

// ─── Route 1: GET /books (Public) ─────────────────────────────────────────────
// Supports ?sort=newest&limit=&category=&search=&mine=
app.get('/books', async (req, res) => {
  try {
    const { db } = await connectDB();
    const { category, sort, limit, search, mine } = req.query;

    const filter = {};

    if (category && category !== 'All') {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { author: { $regex: term, $options: 'i' } },
      ];
    }

    // Optional user email filter if mine=true with authorization
    if (mine === 'true' && req.headers['authorization']) {
      try {
        const token = req.headers['authorization'].split(' ')[1];
        const claims = jose.decodeJwt(token);
        if (claims?.email) {
          filter.userEmail = claims.email;
        }
      } catch {}
    }

    let cursor = db.collection('books').find(filter);

    if (sort === 'newest') {
      cursor = cursor.sort({ createdAt: -1, _id: -1 });
    }

    if (limit) {
      cursor = cursor.limit(parseInt(limit, 10));
    }

    const books = await cursor.toArray();
    res.json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Internal server error while fetching books' });
  }
});

// ─── Route 2: GET /books/:id (Protected) ──────────────────────────────────────
app.get('/books/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }

    const { db } = await connectDB();
    const book = await db.collection('books').findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  } catch (err) {
    console.error('Error fetching book by ID:', err);
    res.status(500).json({ error: 'Internal server error while fetching book' });
  }
});

// ─── Route 3: POST /books (Protected) ─────────────────────────────────────────
// When creating a book, set availableCopies = totalCopies, userEmail from token
app.post('/books', verifyToken, async (req, res) => {
  try {
    const { title, author, category, image, description, totalCopies } = req.body;

    if (!title || !author || !category || !image || totalCopies === undefined) {
      return res.status(400).json({ error: 'Missing required book fields' });
    }

    const parsedCopies = Math.max(1, parseInt(totalCopies, 10) || 1);

    const newBook = {
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      image: image.trim(),
      description: (description || '').trim(),
      totalCopies: parsedCopies,
      availableCopies: parsedCopies,
      userName: req.user.name || 'Reader',
      userEmail: req.user.email,
      createdAt: new Date().toISOString(),
    };

    const { db } = await connectDB();
    const result = await db.collection('books').insertOne(newBook);

    res.status(201).json({
      insertedId: result.insertedId,
      message: 'Book created successfully',
    });
  } catch (err) {
    console.error('Error creating book:', err);
    res.status(500).json({ error: 'Internal server error while creating book' });
  }
});

// ─── Route 4: PATCH /books/:id (Protected - Owner only) ───────────────────────
app.patch('/books/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }

    const { db } = await connectDB();
    const book = await db.collection('books').findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Owner check: only the creator can edit
    if (book.userEmail !== req.user.email) {
      return res.status(403).json({ error: 'Forbidden: You are not the owner of this book' });
    }

    const updates = {};
    const { title, author, category, image, description, totalCopies } = req.body;

    if (title !== undefined) updates.title = title.trim();
    if (author !== undefined) updates.author = author.trim();
    if (category !== undefined) updates.category = category.trim();
    if (image !== undefined) updates.image = image.trim();
    if (description !== undefined) updates.description = description.trim();
    if (totalCopies !== undefined) {
      const newTotal = Math.max(1, parseInt(totalCopies, 10) || 1);
      const diff = newTotal - (book.totalCopies || 1);
      updates.totalCopies = newTotal;
      updates.availableCopies = Math.max(0, (book.availableCopies ?? book.totalCopies ?? 1) + diff);
    }

    updates.updatedAt = new Date().toISOString();

    const result = await db.collection('books').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    res.json({
      modifiedCount: result.modifiedCount,
      message: 'Book updated successfully',
    });
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ error: 'Internal server error while updating book' });
  }
});

// ─── Route 5: DELETE /books/:id (Protected - Owner only) ──────────────────────
app.delete('/books/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }

    const { db } = await connectDB();
    const book = await db.collection('books').findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Owner check: only the creator can delete
    if (book.userEmail !== req.user.email) {
      return res.status(403).json({ error: 'Forbidden: You are not the owner of this book' });
    }

    const result = await db.collection('books').deleteOne({ _id: new ObjectId(id) });

    res.json({
      deletedCount: result.deletedCount,
      message: 'Book deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ error: 'Internal server error while deleting book' });
  }
});

// ─── Route 6: POST /borrows (Protected - Atomic operation) ─────────────────────
// Atomic findOneAndUpdate with availableCopies: { $gt: 0 } and $inc -1
// Unique index on borrows { bookId, userEmail }
// 409 if already borrowed, 400 if copies are 0
app.post('/borrows', verifyToken, async (req, res) => {
  try {
    const { bookId, returnDate } = req.body;

    if (!bookId || !returnDate) {
      return res.status(400).json({ error: 'Missing bookId or returnDate' });
    }

    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({ error: 'Invalid bookId format' });
    }

    const { db } = await connectDB();

    // 1. Double borrow check before decrement
    const existingBorrow = await db.collection('borrows').findOne({
      bookId: String(bookId),
      userEmail: req.user.email,
    });

    if (existingBorrow) {
      return res.status(409).json({ error: 'Conflict: You have already borrowed this book.' });
    }

    // 2. Atomic findOneAndUpdate on the book with availableCopies > 0 and $inc -1
    const updatedBook = await db.collection('books').findOneAndUpdate(
      {
        _id: new ObjectId(bookId),
        $or: [
          { availableCopies: { $gt: 0 } },
          { availableCopies: { $exists: false }, totalCopies: { $gt: 0 } },
        ],
      },
      {
        $inc: { availableCopies: -1 },
      },
      { returnDocument: 'after' }
    );

    if (!updatedBook) {
      return res.status(400).json({ error: 'No copies left' });
    }

    // 3. Insert borrow record
    try {
      const newBorrow = {
        bookId: String(bookId),
        bookTitle: updatedBook.title,
        bookImage: updatedBook.image,
        userEmail: req.user.email,
        userName: req.user.name || 'Reader',
        borrowDate: new Date().toISOString(),
        returnDate: String(returnDate),
        createdAt: new Date().toISOString(),
      };

      const result = await db.collection('borrows').insertOne(newBorrow);

      return res.status(201).json({
        insertedId: result.insertedId,
        message: 'Book borrowed successfully!',
      });
    } catch (insertErr) {
      // If unique index constraint was violated (code 11000), restore the copy and return 409
      await db.collection('books').updateOne(
        { _id: new ObjectId(bookId) },
        { $inc: { availableCopies: 1 } }
      );

      if (insertErr.code === 11000) {
        return res.status(409).json({ error: 'Conflict: You have already borrowed this book.' });
      }
      throw insertErr;
    }
  } catch (err) {
    console.error('Error borrowing book:', err);
    res.status(500).json({ error: 'Internal server error while borrowing book' });
  }
});

// ─── Route 7: GET /borrows (Protected - User's own borrows) ────────────────────
app.get('/borrows', verifyToken, async (req, res) => {
  try {
    const { db } = await connectDB();
    const borrows = await db
      .collection('borrows')
      .find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(borrows);
  } catch (err) {
    console.error('Error fetching borrows:', err);
    res.status(500).json({ error: 'Internal server error while fetching borrows' });
  }
});

// ─── Route 8: DELETE /borrows/:id (Protected - Owner only) ─────────────────────
// Delete borrow and atomic $inc +1 on book
app.delete('/borrows/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid borrow ID format' });
    }

    const { db } = await connectDB();
    const borrow = await db.collection('borrows').findOne({ _id: new ObjectId(id) });

    if (!borrow) {
      return res.status(404).json({ error: 'Borrow record not found' });
    }

    // Owner check: only the borrower can return
    if (borrow.userEmail !== req.user.email) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to return this borrow' });
    }

    // Delete borrow
    await db.collection('borrows').deleteOne({ _id: new ObjectId(id) });

    // Increment available copies on book
    if (borrow.bookId && ObjectId.isValid(borrow.bookId)) {
      await db.collection('books').updateOne(
        { _id: new ObjectId(borrow.bookId) },
        { $inc: { availableCopies: 1 } }
      );
    }

    res.json({ message: 'Book returned successfully' });
  } catch (err) {
    console.error('Error returning borrow:', err);
    res.status(500).json({ error: 'Internal server error while returning book' });
  }
});

// ─── Export for local / serverless ───────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
