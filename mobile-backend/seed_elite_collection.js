const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('./models/Book');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/elibrary";

const eliteBooks = [
  {
    legacyId: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    description: "A story of wealth, love, and the American Dream in the 1920s.",
    category: "Fiction",
    coverUrl: "https://covers.openlibrary.org/b/id/12643501-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/the-great-gatsby.pdf",
    publicationYear: 1925,
    totalPages: 180,
    rating: 4.5
  },
  {
    legacyId: 2,
    title: "1984",
    author: "George Orwell",
    description: "A dystopian social science fiction novel and cautionary tale.",
    category: "Science Fiction",
    coverUrl: "https://covers.openlibrary.org/b/id/10531580-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/1984.pdf",
    publicationYear: 1949,
    totalPages: 328,
    rating: 4.8
  },
  {
    legacyId: 3,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    description: "A romantic novel of manners written by Jane Austen.",
    category: "Romance",
    coverUrl: "https://covers.openlibrary.org/b/id/12648777-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/pride-and-prejudice.pdf",
    publicationYear: 1813,
    totalPages: 278,
    rating: 4.6
  },
  {
    legacyId: 4,
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    description: "A tale of a girl named Alice falling through a rabbit hole.",
    category: "Fantasy",
    coverUrl: "https://covers.openlibrary.org/b/id/11153123-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/alices-adventures-in-wonderland.pdf",
    publicationYear: 1865,
    totalPages: 110,
    rating: 4.2
  },
  {
    legacyId: 5,
    title: "Frankenstein",
    author: "Mary Shelley",
    description: "The story of Victor Frankenstein and the creature he creates.",
    category: "Horror",
    coverUrl: "https://covers.openlibrary.org/b/id/12818862-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/frankenstein.pdf",
    publicationYear: 1818,
    totalPages: 280,
    rating: 4.1
  },
  {
    legacyId: 6,
    title: "Sherlock Holmes",
    author: "Arthur Conan Doyle",
    description: "The adventures of the world's most famous consulting detective.",
    category: "Mystery",
    coverUrl: "https://covers.openlibrary.org/b/id/10483162-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/the-adventures-of-sherlock-holmes.pdf",
    publicationYear: 1892,
    totalPages: 300,
    rating: 4.7
  },
  {
    legacyId: 7,
    title: "Dracula",
    author: "Bram Stoker",
    description: "The classic vampire story that defined the genre.",
    category: "Horror",
    coverUrl: "https://covers.openlibrary.org/b/id/10526017-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/dracula.pdf",
    publicationYear: 1897,
    totalPages: 418,
    rating: 4.3
  },
  {
    legacyId: 8,
    title: "Treasure Island",
    author: "Robert Louis Stevenson",
    description: "An adventure novel of pirates and buried gold.",
    category: "Adventure",
    coverUrl: "https://covers.openlibrary.org/b/id/10524458-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/treasure-island.pdf",
    publicationYear: 1883,
    totalPages: 240,
    rating: 4.0
  },
  {
    legacyId: 9,
    title: "War and Peace",
    author: "Leo Tolstoy",
    description: "A monumental work chronicles the French invasion of Russia.",
    category: "Historical",
    coverUrl: "https://covers.openlibrary.org/b/id/10522818-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/war-and-peace.pdf",
    publicationYear: 1869,
    totalPages: 1225,
    rating: 4.4
  },
  {
    legacyId: 10,
    title: "Ulysses",
    author: "James Joyce",
    description: "A modernist masterpiece following Leopold Bloom through Dublin.",
    category: "Classic",
    coverUrl: "https://covers.openlibrary.org/b/id/10523048-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/ulysses.pdf",
    publicationYear: 1922,
    totalPages: 730,
    rating: 3.9
  },
  {
    legacyId: 11,
    title: "Moby Dick",
    author: "Herman Melville",
    description: "The obsessive quest of Ahab for revenge on Moby Dick.",
    category: "Adventure",
    coverUrl: "https://covers.openlibrary.org/b/id/10522880-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/moby-dick.pdf",
    publicationYear: 1851,
    totalPages: 635,
    rating: 4.1
  },
  {
    legacyId: 12,
    title: "Great Expectations",
    author: "Charles Dickens",
    description: "The coming-of-age story of an orphan named Pip.",
    category: "Classic",
    coverUrl: "https://covers.openlibrary.org/b/id/10523041-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/great-expectations.pdf",
    publicationYear: 1861,
    totalPages: 505,
    rating: 4.4
  },
  {
    legacyId: 13,
    title: "Les Miserables",
    author: "Victor Hugo",
    description: "The lives and interactions of several characters in 19th-century France.",
    category: "Classic",
    coverUrl: "https://covers.openlibrary.org/b/id/10522822-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/les-miserables.pdf",
    publicationYear: 1862,
    totalPages: 1463,
    rating: 4.6
  },
  {
    legacyId: 14,
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    description: "Set in London and Paris before and during the French Revolution.",
    category: "Historical",
    coverUrl: "https://covers.openlibrary.org/b/id/10523038-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/a-tale-of-two-cities.pdf",
    publicationYear: 1859,
    totalPages: 448,
    rating: 4.5
  },
  {
    legacyId: 15,
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    description: "A young man sells his soul for eternal youth.",
    category: "Philosophy",
    coverUrl: "https://covers.openlibrary.org/b/id/10523032-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/the-picture-of-dorian-gray.pdf",
    publicationYear: 1890,
    totalPages: 254,
    rating: 4.7
  },
  {
    legacyId: 16,
    title: "Heart of Darkness",
    author: "Joseph Conrad",
    description: "A journey up the Congo River into the heart of Africa.",
    category: "Fiction",
    coverUrl: "https://covers.openlibrary.org/b/id/10523044-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/heart-of-darkness.pdf",
    publicationYear: 1899,
    totalPages: 120,
    rating: 4.2
  },
  {
    legacyId: 17,
    title: "Beyond Good and Evil",
    author: "Friedrich Nietzsche",
    description: "A philosopher's challenge to traditional morality.",
    category: "Philosophy",
    coverUrl: "https://covers.openlibrary.org/b/id/10523050-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/beyond-good-and-evil.pdf",
    publicationYear: 1886,
    totalPages: 240,
    rating: 4.3
  },
  {
    legacyId: 18,
    title: "The Odyssey",
    author: "Homer",
    description: "Odysseus's epic ten-year journey home from Troy.",
    category: "Epic",
    coverUrl: "https://covers.openlibrary.org/b/id/10523028-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/the-odyssey.pdf",
    publicationYear: -800,
    totalPages: 500,
    rating: 4.8
  },
  {
    legacyId: 19,
    title: "Grimms' Fairy Tales",
    author: "The Brothers Grimm",
    description: "A collection of German folk tales and fairy stories.",
    category: "Fairy Tale",
    coverUrl: "https://covers.openlibrary.org/b/id/10523035-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/grimms-fairy-tales.pdf",
    publicationYear: 1812,
    totalPages: 400,
    rating: 4.5
  },
  {
    legacyId: 20,
    title: "The Metamorphosis",
    author: "Franz Kafka",
    description: "A salesman wakes up to find himself transformed into an insect.",
    category: "Fiction",
    coverUrl: "https://covers.openlibrary.org/b/id/10523031-L.jpg",
    pdfUrl: "https://www.planetebook.com/free-ebooks/the-metamorphosis.pdf",
    publicationYear: 1915,
    totalPages: 100,
    rating: 4.6
  }
];

async function seedElite() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    // Clear and restore
    await Book.deleteMany({});
    
    console.log(`Inserting ${eliteBooks.length} elite classic books...`);
    await Book.insertMany(eliteBooks);

    console.log("Successfully restored your previous classic collection!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Restoration failed:", error);
    process.exit(1);
  }
}

seedElite();
