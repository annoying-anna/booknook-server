require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// ─── MongoDB Client ───────────────────────────────────────────────────────────
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const db = client.db('booknook');
const booksCollection = db.collection('books');
const borrowsCollection = db.collection('borrows');

// ─── JWT Middleware ───────────────────────────────────────────────────────────
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'booknook_jwt_secret_key_2024');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// ── Root ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '📚 BookNook Server API is running smoothly!',
    status: 'online',
    endpoints: [
      'POST /jwt',
      'GET /books',
      'GET /books/new-arrivals',
      'GET /books/:id',
      'POST /books',
      'PATCH /books/:id',
      'DELETE /books/:id',
      'POST /borrows',
      'GET /borrows',
      'DELETE /borrows/:id'
    ]
  });
});

// ── JWT ───────────────────────────────────────────────────────────────────
app.post('/jwt', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET || 'booknook_jwt_secret_key_2024',
    { expiresIn: '7d' }
  );
  res.json({ token, message: 'Token generated successfully' });
});

// ── Books ─────────────────────────────────────────────────────────────────
app.get('/books', async (req, res) => {
  try {
    const { email, limit, category } = req.query;
    const query = {};
    if (email) {
      query.addedByEmail = email;
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    let cursor = booksCollection.find(query).sort({ createdAt: -1 });
    if (limit) {
      cursor = cursor.limit(parseInt(limit));
    }

    const books = await cursor.toArray();
    res.json(books);
  } catch (err) {
    console.error('GET /books error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/books/new-arrivals', async (req, res) => {
  try {
    const books = await booksCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    res.json(books);
  } catch (err) {
    console.error('GET /books/new-arrivals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }
    const book = await booksCollection.findOne({ _id: new ObjectId(id) });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    console.error('GET /books/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/books', verifyToken, async (req, res) => {
  try {
    const { title, author, category, image, description, addedByName, addedByEmail, totalCopies } = req.body;
    if (!title || !author || !category || !image || !description) {
      return res.status(400).json({ error: 'Missing required book fields' });
    }

    const newBook = {
      title,
      author,
      category,
      image,
      description,
      addedByName: addedByName || req.user.email,
      addedByEmail: addedByEmail || req.user.email,
      totalCopies: parseInt(totalCopies) >= 0 ? parseInt(totalCopies) : 1,
      createdAt: new Date().toISOString(),
    };

    const result = await booksCollection.insertOne(newBook);
    res.status(201).json({ insertedId: result.insertedId, message: 'Book added successfully' });
  } catch (err) {
    console.error('POST /books error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/books/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }

    const updates = { ...req.body };
    delete updates._id;

    if (updates.totalCopies !== undefined) {
      updates.totalCopies = parseInt(updates.totalCopies) || 0;
    }

    const result = await booksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ modifiedCount: result.modifiedCount, message: 'Book updated successfully' });
  } catch (err) {
    console.error('PATCH /books/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/books/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }

    const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ deletedCount: result.deletedCount, message: 'Book deleted successfully' });
  } catch (err) {
    console.error('DELETE /books/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Borrows ───────────────────────────────────────────────────────────────
app.post('/borrows', verifyToken, async (req, res) => {
  try {
    const { bookId, bookTitle, bookImage, userEmail, userName, borrowDate, returnDate } = req.body;
    const targetEmail = userEmail || req.user.email;

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    // 1. Check if user already borrowed this book and hasn't returned it
    const existingBorrow = await borrowsCollection.findOne({ bookId, userEmail: targetEmail });
    if (existingBorrow) {
      return res.status(400).json({ 
        error: 'already_borrowed', 
        message: 'You have already borrowed this book. Please return it before borrowing again!' 
      });
    }

    // 2. Check available copies
    if (ObjectId.isValid(bookId)) {
      const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      if ((book.totalCopies || 0) <= 0) {
        return res.status(400).json({ 
          error: 'out_of_stock', 
          message: 'This book currently has 0 copies available for borrow.' 
        });
      }

      // 3. Decrement totalCopies in books collection with $inc
      await booksCollection.updateOne(
        { _id: new ObjectId(bookId) },
        { $inc: { totalCopies: -1 } }
      );
    }

    // 4. Insert borrow record
    const borrowRecord = {
      bookId,
      bookTitle: bookTitle || 'Unknown Book',
      bookImage: bookImage || '',
      userEmail: targetEmail,
      userName: userName || 'BookNook Member',
      borrowDate: borrowDate || new Date().toISOString().split('T')[0],
      returnDate: returnDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      borrowedAt: new Date().toISOString(),
    };

    const result = await borrowsCollection.insertOne(borrowRecord);
    res.status(201).json({ insertedId: result.insertedId, message: 'Book borrowed successfully!' });
  } catch (err) {
    console.error('POST /borrows error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/borrows', verifyToken, async (req, res) => {
  try {
    const tokenEmail = req.user.email;
    const queryEmail = req.query.email;
    const filterEmail = queryEmail || tokenEmail;

    const borrows = await borrowsCollection
      .find({ userEmail: filterEmail })
      .sort({ borrowedAt: -1 })
      .toArray();

    res.json(borrows);
  } catch (err) {
    console.error('GET /borrows error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/borrows/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid borrow ID format' });
    }

    const borrowRecord = await borrowsCollection.findOne({ _id: new ObjectId(id) });
    if (!borrowRecord) {
      return res.status(404).json({ error: 'Borrow record not found' });
    }

    await borrowsCollection.deleteOne({ _id: new ObjectId(id) });

    if (borrowRecord.bookId && ObjectId.isValid(borrowRecord.bookId)) {
      await booksCollection.updateOne(
        { _id: new ObjectId(borrowRecord.bookId) },
        { $inc: { totalCopies: 1 } }
      );
    }

    res.json({ message: 'Book returned successfully!' });
  } catch (err) {
    console.error('DELETE /borrows/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Connect & Start Server ────────────────────────────────────────────────────
client.connect().then(() => {
  console.log('✅ Connected to MongoDB Atlas');
}).catch(err => {
  console.error('⚠️ MongoDB Connection warning:', err);
});

app.listen(port, () => {
  console.log(`🚀 BookNook server running on port ${port}`);
});

module.exports = app;
