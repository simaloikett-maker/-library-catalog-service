require('dotenv').config();

const mongoose = require('mongoose');
const Book = require('./models/Book');
const Genre = require('./models/Genre');

const genreData = [
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Science Fiction', slug: 'science-fiction' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Historical Fiction', slug: 'historical-fiction' },
];

const bookData = [
  { title: 'The Cartographer of Ash', author: 'Mira Ellison', isbn: '978-0-000-00001-9', description: 'A mapmaker discovers that the borders on her charts shift with every secret kept by the kingdom.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000019-L.jpg', totalCopies: 8, availableCopies: 6, genreSlug: 'fantasy' },
  { title: 'A Crown of Winterglass', author: 'Tomas Vale', isbn: '978-0-000-00002-6', description: 'An apprentice glassworker must unite rival mountain clans before an ancient ice crown melts.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000026-L.jpg', totalCopies: 5, availableCopies: 5, genreSlug: 'fantasy' },
  { title: 'The Orchard at the Edge', author: 'Leonie Hart', isbn: '978-0-000-00003-3', description: 'A quiet orchard grows fruit that lets its owner revisit one forgotten day.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000033-L.jpg', totalCopies: 7, availableCopies: 3, genreSlug: 'fantasy' },
  { title: 'Beneath the Copper Moon', author: 'Ari Calder', isbn: '978-0-000-00004-0', description: 'A retired dragon keeper returns to the capital to solve the disappearance of the royal library.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000040-L.jpg', totalCopies: 4, availableCopies: 2, genreSlug: 'fantasy' },
  { title: 'Signal at Perihelion', author: 'Nadia Sol', isbn: '978-0-000-00005-7', description: 'A deep-space survey crew receives a message that appears to come from their own future.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000057-L.jpg', totalCopies: 9, availableCopies: 7, genreSlug: 'science-fiction' },
  { title: 'The Quiet Terraformer', author: 'Elias Wren', isbn: '978-0-000-00006-4', description: 'On a distant colony, a soil scientist uncovers evidence that the planet is changing itself.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000064-L.jpg', totalCopies: 6, availableCopies: 4, genreSlug: 'science-fiction' },
  { title: 'Archive of the Tides', author: 'Jun Park', isbn: '978-0-000-00007-1', description: 'An archivist on a water-covered moon finds memories stored in the planetwide ocean.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000071-L.jpg', totalCopies: 10, availableCopies: 8, genreSlug: 'science-fiction' },
  { title: 'Tomorrow, Repeated', author: 'S. L. Mercer', isbn: '978-0-000-00008-8', description: 'A transit engineer investigates a commuter train that arrives at the same station one day early.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000088-L.jpg', totalCopies: 5, availableCopies: 1, genreSlug: 'science-fiction' },
  { title: 'The Last Bell at Marlowe House', author: 'Beatrice North', isbn: '978-0-000-00009-5', description: 'A village librarian pieces together a decades-old disappearance from notes hidden in returned books.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000095-L.jpg', totalCopies: 8, availableCopies: 6, genreSlug: 'mystery' },
  { title: 'A Study in Blue Glass', author: 'Owen Finch', isbn: '978-0-000-00010-1', description: 'A conservator finds a coded message beneath the frame of a portrait linked to a museum theft.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000101-L.jpg', totalCopies: 6, availableCopies: 3, genreSlug: 'mystery' },
  { title: 'The Lantern Keeper’s Alibi', author: 'Ruth Bellamy', isbn: '978-0-000-00011-8', description: 'During a coastal storm, a detective questions the only witness to a locked-room crime.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000118-L.jpg', totalCopies: 7, availableCopies: 7, genreSlug: 'mystery' },
  { title: 'Three Keys to Hollow Street', author: 'Malik Rowan', isbn: '978-0-000-00012-5', description: 'Three neighbors receive keys to the same sealed townhouse and each remembers a different owner.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000125-L.jpg', totalCopies: 4, availableCopies: 2, genreSlug: 'mystery' },
  { title: 'The Indigo Seamstress', author: 'Clara Whitcomb', isbn: '978-0-000-00013-2', description: 'A seamstress in wartime Lisbon passes coded messages through the hems of diplomatic gowns.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000132-L.jpg', totalCopies: 9, availableCopies: 5, genreSlug: 'historical-fiction' },
  { title: 'Letters from the Iron Garden', author: 'Samuel Ives', isbn: '978-0-000-00014-9', description: 'A railway clerk documents a changing city through letters exchanged with a botanist abroad.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000149-L.jpg', totalCopies: 6, availableCopies: 4, genreSlug: 'historical-fiction' },
  { title: 'The Winter Room in Kyoto', author: 'Emi Takahashi', isbn: '978-0-000-00015-6', description: 'A young translator returns to 1920s Kyoto to settle a family debt and uncover a hidden journal.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000156-L.jpg', totalCopies: 5, availableCopies: 3, genreSlug: 'historical-fiction' },
  { title: 'A Map of Unfinished Roads', author: 'Peter Alden', isbn: '978-0-000-00016-3', description: 'A surveyor joins an expedition across a newly opened frontier and questions who gets to name it.', coverImage: 'https://covers.openlibrary.org/b/isbn/9780000000163-L.jpg', totalCopies: 8, availableCopies: 6, genreSlug: 'historical-fiction' },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required. Add it to your .env file before seeding.');
  }

  try {
    await mongoose.connect(uri);
    await Promise.all([Book.deleteMany({}), Genre.deleteMany({})]);

    const genres = await Genre.insertMany(genreData);
    const genreIds = new Map(genres.map((genre) => [genre.slug, genre._id]));
    const books = bookData.map(({ genreSlug, ...book }) => ({
      ...book,
      genre: genreIds.get(genreSlug),
    }));

    await Book.insertMany(books);
    console.log(`Seeded ${genres.length} genres and ${books.length} books.`);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

seed().catch((error) => {
  console.error('Catalog seed failed:', error.message);
  process.exitCode = 1;
});
