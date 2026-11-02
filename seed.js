require('dotenv').config();
const { MongoClient } = require('mongodb');

const booksData = [
  // ─── FICTION ───────────────────────────────────────────────────────────────
  {
    title: "1984",
    author: "George Orwell",
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
    description: "Winston Smith lives in a dystopian future society under constant surveillance by Big Brother. A harrowing critique of totalitarianism, language manipulation (Newspeak), and psychological control that remains startlingly relevant.",
    userName: "Sophia Chen",
    userEmail: "sophia.chen@literaryclub.io",
    totalCopies: 6,
    availableCopies: 4,
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800",
    description: "Set in Maycomb, Alabama, this Pulitzer Prize-winning classic follows young Scout Finch as her father, attorney Atticus Finch, defends an innocent Black man falsely accused of a crime. A luminous exploration of empathy and moral courage.",
    userName: "Marcus Vance",
    userEmail: "marcus.vance@readingschool.org",
    totalCopies: 5,
    availableCopies: 3,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800",
    description: "Jay Gatsby's decadent Long Island parties mask a tragic longing for Daisy Buchanan. Fitzgerald's masterpiece exposes the illusion of the American Dream, the Jazz Age's excess, and the longing for an unrecoverable past.",
    userName: "Elena Rostova",
    userEmail: "elena.rostova@oxford.ac.uk",
    totalCopies: 5,
    availableCopies: 0, // Demonstrates out-of-stock badge
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=800",
    description: "The multi-generational saga of the Buendía family in the mythical Colombian town of Macondo. A monumental pinnacle of magical realism weaving civil wars, miracles, and the relentless cycle of human solitude.",
    userName: "Alexander Wright",
    userEmail: "alex.wright@booknook.com",
    totalCopies: 4,
    availableCopies: 4,
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800",
    description: "Impoverished student Rodion Raskolnikov tests his theory of extraordinary men by murdering an unscrupulous pawnbroker. What follows is a gripping psychological thriller exploring guilt, mental agony, and redemption in 19th-century St. Petersburg.",
    userName: "Hasan Mahmud",
    userEmail: "hasan.mahmud@dhakareads.org",
    totalCopies: 3,
    availableCopies: 2,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },

  // ─── SCIENCE ───────────────────────────────────────────────────────────────
  {
    title: "Cosmos",
    author: "Carl Sagan",
    category: "Science",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
    description: "Fifteen billion years of cosmic evolution transforming matter into consciousness. Sagan's lyrical masterpiece connects the history of science, the birth of stars, the origins of life, and humanity's destiny among the galaxies.",
    userName: "Dr. Evelyn Reed",
    userEmail: "evelyn.reed@cambridge.edu",
    totalCopies: 6,
    availableCopies: 5,
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    category: "Science",
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=800",
    description: "From the Big Bang to black holes and string theory, Hawking guides non-specialists through fundamental questions about the nature of space, time, and the universe with remarkable clarity and wit.",
    userName: "Dr. Evelyn Reed",
    userEmail: "evelyn.reed@cambridge.edu",
    totalCopies: 4,
    availableCopies: 2,
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "The Gene: An Intimate History",
    author: "Siddhartha Mukherjee",
    category: "Science",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
    description: "Mukherjee weaves science, social history, and personal family tragedy into a definitive biography of the gene—the fundamental unit of heredity—from Mendel’s pea plants to CRISPR gene-editing technology.",
    userName: "Amina Rahman",
    userEmail: "amina.rahman@booklovers.org",
    totalCopies: 4,
    availableCopies: 3,
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "Astrophysics for People in a Hurry",
    author: "Neil deGrasse Tyson",
    category: "Science",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800",
    description: "What is the nature of space and time? How do we fit within the cosmos? Tyson brings the universe down to Earth in bite-sized chapters exploring quantum mechanics, dark matter, and exoplanets.",
    userName: "Alexander Wright",
    userEmail: "alex.wright@booknook.com",
    totalCopies: 5,
    availableCopies: 5,
    createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "Silent Spring",
    author: "Rachel Carson",
    category: "Science",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800",
    description: "The groundbreaking environmental classic that exposed the devastating ecological consequences of synthetic pesticides, sparked the global environmental movement, and led to the creation of the EPA.",
    userName: "Marcus Vance",
    userEmail: "marcus.vance@readingschool.org",
    totalCopies: 3,
    availableCopies: 1,
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },

  // ─── HISTORY ───────────────────────────────────────────────────────────────
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    category: "History",
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800",
    description: "From insignificant apes to rulers of planet Earth, Harari examines how cognitive, agricultural, and scientific revolutions enabled Homo sapiens to conquer the globe through shared fictions like money, religion, and nations.",
    userName: "Sophia Chen",
    userEmail: "sophia.chen@literaryclub.io",
    totalCopies: 6,
    availableCopies: 4,
    createdAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "Guns, Germs, and Steel",
    author: "Jared Diamond",
    category: "History",
    image: "https://images.unsplash.com/photo-1447069387593-a5de07624818?auto=format&fit=crop&q=80&w=800",
    description: "Why did Eurasians conquer native peoples of the Americas, Africa, and Australia rather than vice versa? Diamond's Pulitzer-winning work reveals how geography, food production, and immunity shaped modern civilization.",
    userName: "Elena Rostova",
    userEmail: "elena.rostova@oxford.ac.uk",
    totalCopies: 3,
    availableCopies: 2,
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "The Silk Roads: A New History",
    author: "Peter Frankopan",
    category: "History",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=800",
    description: "A major reassessment of world history shifting the axis away from the West toward Central Asia and the East, where trade routes exchanged silk, spices, religions, philosophies, and empires.",
    userName: "Hasan Mahmud",
    userEmail: "hasan.mahmud@dhakareads.org",
    totalCopies: 4,
    availableCopies: 3,
    createdAt: new Date(Date.now() - 13 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    category: "History",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800",
    description: "Written in hiding during the Nazi occupation of Amsterdam, Anne Frank's poignant journal records the daily life, fears, hopes, and burgeoning maturity of a young girl with an enduring belief in the goodness of humanity.",
    userName: "Amina Rahman",
    userEmail: "amina.rahman@booklovers.org",
    totalCopies: 5,
    availableCopies: 5,
    createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },

  // ─── KIDS ──────────────────────────────────────────────────────────────────
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    category: "Kids",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800",
    description: "A gentle and timeless philosophical fable of an aviator stranded in the Sahara who meets a young prince fallen to Earth from Asteroid B-612. An unforgettable lesson: 'It is only with the heart that one can see rightly.'",
    userName: "Marcus Vance",
    userEmail: "marcus.vance@readingschool.org",
    totalCopies: 6,
    availableCopies: 5,
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    category: "Kids",
    image: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?auto=format&fit=crop&q=80&w=800",
    description: "Bilbo Baggins, a respectable and peace-loving hobbit, is whisked out of his cozy hole by Gandalf the wizard and thirteen dwarves on an epic quest to reclaim the Lonely Mountain and its dragon-guarded treasure.",
    userName: "Alexander Wright",
    userEmail: "alex.wright@booknook.com",
    totalCopies: 5,
    availableCopies: 3,
    createdAt: new Date(Date.now() - 16 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "Charlotte's Web",
    author: "E.B. White",
    category: "Kids",
    image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800",
    description: "The tender story of a clever spider named Charlotte who saves Wilbur the pig from slaughter by weaving miraculous messages praising him in her barn web. A tender tribute to friendship, mortality, and loyalty.",
    userName: "Sophia Chen",
    userEmail: "sophia.chen@literaryclub.io",
    totalCopies: 4,
    availableCopies: 2,
    createdAt: new Date(Date.now() - 17 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "Where the Wild Things Are",
    author: "Maurice Sendak",
    category: "Kids",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800",
    description: "Sent to bed without supper for wearing his wolf suit and making mischief, young Max sails off to an island inhabited by wild monsters who crown him their king, until longing for home calls him back.",
    userName: "Amina Rahman",
    userEmail: "amina.rahman@booklovers.org",
    totalCopies: 4,
    availableCopies: 0, // Demonstrates out-of-stock badge
    createdAt: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
  },

  // ─── OTHERS ────────────────────────────────────────────────────────────────
  {
    title: "Atomic Habits",
    author: "James Clear",
    category: "Others",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
    description: "Tiny changes lead to remarkable results. Clear draws on biology, psychology, and neuroscience to create an easy-to-understand framework for making good habits inevitable and bad habits impossible.",
    userName: "Alexander Wright",
    userEmail: "alex.wright@booknook.com",
    totalCopies: 7,
    availableCopies: 5,
    createdAt: new Date(Date.now() - 19 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    category: "Others",
    image: "https://images.unsplash.com/photo-1507842229451-7f01be7fe023?auto=format&fit=crop&q=80&w=800",
    description: "Nobel laureate Daniel Kahneman takes us on a groundbreaking tour of the mind, explaining the two systems that drive the way we think: System 1 (fast, intuitive, emotional) and System 2 (slower, deliberative, logical).",
    userName: "Dr. Evelyn Reed",
    userEmail: "evelyn.reed@cambridge.edu",
    totalCopies: 4,
    availableCopies: 3,
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    category: "Others",
    image: "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&q=80&w=800",
    description: "Psychiatrist Viktor Frankl’s memoir of surviving Auschwitz and Dachau, where he discovered logotherapy: the conviction that man's deepest drive is not pleasure or power, but the discovery of purpose even amidst suffering.",
    userName: "Elena Rostova",
    userEmail: "elena.rostova@oxford.ac.uk",
    totalCopies: 5,
    availableCopies: 4,
    createdAt: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    category: "Others",
    image: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&q=80&w=800",
    description: "The private journal of the Roman Emperor Marcus Aurelius, written on military campaign between 170 and 180 AD. A foundational cornerstone of Stoic philosophy emphasizing virtue, discipline, and emotional serenity.",
    userName: "Hasan Mahmud",
    userEmail: "hasan.mahmud@dhakareads.org",
    totalCopies: 5,
    availableCopies: 4,
    createdAt: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "The Design of Everyday Things",
    author: "Don Norman",
    category: "Others",
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=800",
    description: "Why do some doors have signs that say 'Push' when you should pull? Cognitive scientist Don Norman reveals how usability and human-centered design turn frustrating everyday objects into intuitive, delightful products.",
    userName: "Sophia Chen",
    userEmail: "sophia.chen@literaryclub.io",
    totalCopies: 4,
    availableCopies: 3,
    createdAt: new Date(Date.now() - 23 * 24 * 3600 * 1000).toISOString(),
  },
  {
    title: "Deep Work",
    author: "Cal Newport",
    category: "Others",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800",
    description: "In an age of endless digital distraction, the ability to focus without interruption on cognitively demanding tasks is becoming extraordinarily rare and valuable. A rigorous playbook to master depth and achieve peak productivity.",
    userName: "Marcus Vance",
    userEmail: "marcus.vance@readingschool.org",
    totalCopies: 5,
    availableCopies: 4,
    createdAt: new Date(Date.now() - 24 * 24 * 3600 * 1000).toISOString(),
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set!");
    process.exit(1);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas!");
    const db = client.db('booknook');

    // Create unique index on borrows
    await db.collection('borrows').createIndex({ bookId: 1, userEmail: 1 }, { unique: true });
    console.log("Compound unique index on borrows { bookId: 1, userEmail: 1 } confirmed.");

    // Replace existing books with the rich 24-volume collection
    await db.collection('books').deleteMany({});
    const res = await db.collection('books').insertMany(booksData);
    console.log(`Successfully populated database with ${res.insertedCount} world-class volumes across all categories!`);
  } catch (err) {
    console.error("Database seed error:", err.message);
  } finally {
    await client.close(true);
  }
}

main();
