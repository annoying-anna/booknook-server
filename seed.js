require('dotenv').config();
const { MongoClient } = require('mongodb');

const sampleBooks = [
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
    description: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it, exploring compassion and injustice.",
    userName: "Library Admin",
    userEmail: "admin@booknook.com",
    totalCopies: 5,
    availableCopies: 5,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    category: "Science",
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=800",
    description: "A landmark volume in science writing by one of the great minds of our time, exploring black holes, time travel, and the origins of the cosmos.",
    userName: "Library Admin",
    userEmail: "admin@booknook.com",
    totalCopies: 4,
    availableCopies: 4,
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    category: "History",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800",
    description: "From a renowned historian comes a groundbreaking narrative of humanity's creation and evolution, from prehistoric apes to modern digital civilization.",
    userName: "Library Admin",
    userEmail: "admin@booknook.com",
    totalCopies: 3,
    availableCopies: 3,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    category: "Kids",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800",
    description: "A poetic tale in which a young prince visits various planets in space, addressing themes of loneliness, friendship, and love.",
    userName: "Library Admin",
    userEmail: "admin@booknook.com",
    totalCopies: 6,
    availableCopies: 6,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    title: "Cosmos",
    author: "Carl Sagan",
    category: "Science",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
    description: "The story of fifteen billion years of cosmic evolution transforming matter and life into consciousness.",
    userName: "Library Admin",
    userEmail: "admin@booknook.com",
    totalCopies: 3,
    availableCopies: 3,
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    category: "Others",
    image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=800",
    description: "An easy and proven way to build good habits and break bad ones. Practical strategies to master tiny behaviors.",
    userName: "Library Admin",
    userEmail: "admin@booknook.com",
    totalCopies: 4,
    availableCopies: 4,
    createdAt: new Date().toISOString()
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800",
    description: "A classic of twentieth-century literature painting an extraordinary portrait of the Jazz Age, extravagance, and passion.",
    userName: "Library Admin",
    userEmail: "admin@booknook.com",
    totalCopies: 5,
    availableCopies: 5,
    createdAt: new Date().toISOString()
  },
  {
    title: "Guns, Germs, and Steel",
    author: "Jared Diamond",
    category: "History",
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800",
    description: "A fascinating assessment of human history, arguing that geography shaped the modern world.",
    userName: "Library Admin",
    userEmail: "admin@booknook.com",
    totalCopies: 2,
    availableCopies: 2,
    createdAt: new Date().toISOString()
  }
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found");
    return;
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas!");
    const db = client.db('booknook');

    // Create unique index on borrows
    await db.collection('borrows').createIndex({ bookId: 1, userEmail: 1 }, { unique: true });
    console.log("Created unique index on borrows { bookId: 1, userEmail: 1 }");

    const existing = await db.collection('books').countDocuments();
    if (existing === 0) {
      const res = await db.collection('books').insertMany(sampleBooks);
      console.log(`Successfully seeded ${res.insertedCount} books!`);
    } else {
      console.log(`Found ${existing} existing books. Syncing availableCopies and user fields...`);
      const books = await db.collection('books').find().toArray();
      for (const b of books) {
        const updates = {};
        if (b.availableCopies === undefined) updates.availableCopies = b.totalCopies || 1;
        if (!b.userName && b.addedByName) updates.userName = b.addedByName;
        if (!b.userEmail && b.addedByEmail) updates.userEmail = b.addedByEmail;
        if (Object.keys(updates).length > 0) {
          await db.collection('books').updateOne({ _id: b._id }, { $set: updates });
        }
      }
      console.log("Books collection synchronized successfully!");
    }
  } catch (err) {
    console.error('Seed Error:', err.message);
  } finally {
    await client.close(true);
  }
}

main();
