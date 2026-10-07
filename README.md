# Library Catalog Service

A MongoDB-backed library catalog API that exposes CRUD endpoints for books and genres, plus query-based filtering, search, and pagination. The seed script creates four genres and sixteen sample books.

## Requirements

- Node.js 18 or newer
- A MongoDB instance (local MongoDB or MongoDB Atlas)

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB connection string.
3. Run `npm run seed` to populate sample catalog data.
4. Start the API with `npm start`.

## API Endpoints

### Genres

- `GET /genres` — list all genres
- `GET /genres/:id` — get a single genre by ID
- `POST /genres` — create a genre
- `PUT /genres/:id` — update a genre
- `DELETE /genres/:id` — delete a genre

### Books

- `GET /books` — list books with optional filters and pagination
- `GET /books/:id` — get a single book by ID
- `POST /books` — create a book
- `PUT /books/:id` — update a book
- `DELETE /books/:id` — delete a book

## Book Query Parameters

`GET /books` supports these query parameters:

- `genre=<genreId>` — only return books in that genre
- `search=<text>` — case-insensitive match against `title` or `author`
- `page=<n>` — page number (defaults to `1`)
- `limit=<n>` — number of results per page (defaults to `10`)

These options can be combined in one request, for example:

- `GET /books?genre=64dbd5d4d5d7a1b2a3c4d5e6&search=dune&page=2&limit=5`

The response includes both the array of matching books and pagination metadata:

```json
{
  "data": [
    { "_id": "...", "title": "Dune" }
  ],
  "pagination": {
    "page": 2,
    "limit": 5,
    "total": 18,
    "totalPages": 4
  }
}
```

## Validation Behavior

All create and update endpoints validate the request body and return HTTP 400 with a clear, field-specific error when input is invalid.

Examples include:

- missing required fields
- wrong or empty string values
- non-integer totals or negative counts
- `availableCopies > totalCopies`
- invalid or nonexistent `genre` IDs

The API does not expose raw Mongoose validation or cast errors to the client.

## Genre Deletion Policy

Deleting a genre is blocked if any books still reference it. This avoids orphaned book records and keeps referential integrity intact. The API returns a 400 error with a message explaining that the genre is still in use.

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

## Postman Collection

The exported collection is stored at `postman/library-catalog.postman_collection.json` and contains requests for every endpoint in the service, including a saved 400 validation example.

## Running the API

```bash
npm run seed
npm start
```

The server listens on `http://localhost:3000` by default. The `PORT` environment variable can be set to override the port.
