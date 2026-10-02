# Library Catalog Service

A small MongoDB/Mongoose data layer for a library catalog. The seed script replaces the current `books` and `genres` data with four genres and sixteen sample books.

## Requirements

- Node.js 18 or newer
- A MongoDB instance (local MongoDB or MongoDB Atlas)

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB connection string.
3. Run `npm run seed`.

The seed command deletes the existing books and genres before inserting its sample data, so use it only in a development or assignment database. It is safe to run repeatedly. The script logs the number of inserted genres and books and disconnects from MongoDB when it finishes or encounters an error.

## Schema Design

`Book` stores information that describes one catalog title, while `Genre` is a separate collection because many books can share a genre. The genre is referenced by MongoDB ObjectId instead of copying the genre name into every book. That keeps the label and slug consistent when they change, at the cost of an additional lookup when displaying a book with its genre.

| Book field | Storage choice | Reasoning and trade-off |
| --- | --- | --- |
| `title` | Embedded string | A title belongs to one catalog record and is read with the book. A separate title collection would add joins without useful reuse. |
| `author` | Embedded string | The assignment needs a display name, not a separately managed author profile. Keeping it on the book makes catalog reads simple; a future author collection would be appropriate if the service needs shared biographies or author-specific pages. |
| `isbn` | Embedded unique string | The ISBN identifies this edition and belongs directly to its book record. A unique index prevents duplicate catalog entries for the same ISBN. |
| `description` | Embedded string | Descriptive text is specific to this catalog record and is usually requested with the title, so embedding avoids another query. |
| `coverImage` | Embedded URL string | The cover URL is a single value displayed with the book. Storing the URL avoids a separate media document; richer image metadata or multiple editions could justify a separate collection later. |
| `totalCopies` | Embedded number | This is the library's local inventory count for this catalog title, so keeping it with the book makes the common availability view direct. It must be a nonnegative integer. |
| `availableCopies` | Embedded number | The on-shelf count changes with checkouts and returns and is read alongside total stock. Keeping both counts together avoids an aggregation on every catalog read; updates should change the counts atomically so they stay consistent. It must be a nonnegative integer no greater than `totalCopies`. |
| `genre` | Referenced ObjectId (`ref: 'Genre'`) | Many books share the same genre and its display name/slug should have one source of truth. The reference avoids duplicated labels and supports updates, at the cost of populating or separately fetching the genre for display. |

`Genre.name` and `Genre.slug` are required and unique. The slug is stored in lowercase so it can be used consistently in URLs. Book ISBNs are required and unique; all book fields are required, and the genre reference must point to a `Genre` document created by the seed script.
