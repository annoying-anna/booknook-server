require('dotenv').config();
const { MongoClient } = require('mongodb');

const sampleBooks = [
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
    description: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it, exploring compassion and injustice.",
    addedByName: "Library Admin",
    addedByEmail: "admin@booknook.com",
    totalCopies: 5,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    category: "Science",
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=800",
    description: "A landmark volume in science writing by one of the great minds of our time, exploring black holes, time travel, and the origins of the cosmos.",
    addedByName: "Library Admin",
    addedByEmail: "admin@booknook.com",
    totalCopies: 4,
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    category: "History",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800",
    description: "From a renowned historian comes a groundbreaking narrative of humanity's creation and evolution, from prehistoric apes to modern digital civilization.",
    addedByName: "Library Admin",
    addedByEmail: "admin@booknook.com",
    totalCopies: 3,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    category: "Kids",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800",
    description: "A poetic tale in which a young prince visits various planets in space, addressing themes of loneliness, friendship, and love.",
    addedByName: "Library Admin",
    addedByEmail: "admin@booknook.com",
    totalCopies: 6,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    title: "Cosmos",
    author: "Carl Sagan",
    category: "Science",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
    description: "The story of fifteen billion years of cosmic evolution transforming matter and life into consciousness.",
    addedByName: "Library Admin",
    addedByEmail: "admin@booknook.com",
    totalCopies: 3,
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    category: "Others",
    image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=800",
    description: "An easy and proven way to build good habits and break bad ones. Practical strategies to master tiny behaviors.",
    addedByName: "Library Admin",
    addedByEmail: "admin@booknook.com",
    totalCopies: 4,
    createdAt: new Date().toISOString()
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800",
    description: "A classic of twentieth-century literature painting an extraordinary portrait of the Jazz Age, extravagance, and passion.",
    addedByName: "Library Admin",
    addedByEmail: "admin@booknook.com",
    totalCopies: 5,
    createdAt: new Date().toISOString()
  },
  {
    title: "Guns, Germs, and Steel",
    author: "Jared Diamond",
    category: "History",
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800",
    description: "A fascinating assessment of human history, arguing that geography shaped the modern world.",
    addedByName: "Library Admin",
    addedByEmail: "admin@booknook.com",
    totalCopies: 2,
    createdAt: new Date().toISOString()
  }
];

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('booknook');
    const existing = await db.collection('books').countDocuments();
    if (existing === 0) {
      const res = await db.collection('books').insertMany(sampleBooks);
      console.log('SUCCESS INSERTED:', res.insertedCount);
    } else {
      console.log('Books already present:', existing);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close(true);
  }
}
main();
