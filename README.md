# Backend Assessment

A NestJS REST API for movie catalog management with user authentication and RBAC, using TypeScript, PostgreSQL, TypeORM, and JWT authentication.

## Setup instructions

### Prerequisites

- Node.js 22 and npm for running the application locally (the Docker image also uses Node.js 22).
- Docker with Docker Compose for the database and optional containerized application.
- Available ports: `3000` (API), `5432` (PostgreSQL), and `8080` (Adminer).

Run all commands from the project root.

### 1. Configure environment variables

Create a `.env` file with the following values. Replace the example password and JWT secret before starting the application. Keep this file out of version control.

```dotenv
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-with-a-local-password
POSTGRES_DB=movies_db

DB_HOST=db
DB_PORT=5432

JWT_SECRET=replace-with-a-random-secret
```

> Use `DB_HOST=db` when the backend runs in Docker. Use `DB_HOST=localhost` when running it locally against the Docker database.

### 2. Start PostgreSQL and create the schema

```sh
docker compose up -d db adminer
```

Open [Adminer](http://localhost:8080) and log in with:

| Setting | Value |
| --- | --- |
| System | PostgreSQL |
| Server | `db` |
| Username | Your `POSTGRES_USER` value |
| Password | Your `POSTGRES_PASSWORD` value |
| Database | Your `POSTGRES_DB` value |

TypeORM uses `synchronize: false`, and this repository does not include migrations or a database initialization script. On a fresh database, use Adminer's **SQL command** screen to run the following SQL before calling the authentication or movie endpoints:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_role VARCHAR(255) NOT NULL DEFAULT 'user'
);

CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(255),
    thumbnail_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

If you want to also populate the ```movies``` table run the following SQL command:

```sql
INSERT INTO movies (title, description, genre, thumbnail_url, video_url)
VALUES
('The Shawshank Redemption', 'Two prisoners form a lasting friendship while serving their sentences.', 'Drama', 'https://placehold.co/300x450/png?text=Movie+1', 'https://example.com/videos/movie-1.mp4'),
('The Godfather', 'The aging patriarch of a powerful crime family transfers control to his son.', 'Crime', 'https://placehold.co/300x450/png?text=Movie+2', 'https://example.com/videos/movie-2.mp4'),
('The Dark Knight', 'Batman faces the Joker as chaos spreads throughout Gotham City.', 'Action', 'https://placehold.co/300x450/png?text=Movie+3', 'https://example.com/videos/movie-3.mp4'),
('Pulp Fiction', 'Interconnected stories explore crime and violence in Los Angeles.', 'Crime', 'https://placehold.co/300x450/png?text=Movie+4', 'https://example.com/videos/movie-4.mp4'),
('Forrest Gump', 'A kindhearted man experiences several defining moments of American history.', 'Drama', 'https://placehold.co/300x450/png?text=Movie+5', 'https://example.com/videos/movie-5.mp4'),
('Inception', 'A skilled thief enters dreams to plant an idea in a target’s mind.', 'Sci-Fi', 'https://placehold.co/300x450/png?text=Movie+6', 'https://example.com/videos/movie-6.mp4'),
('The Matrix', 'A hacker discovers that reality is a simulation controlled by machines.', 'Sci-Fi', 'https://placehold.co/300x450/png?text=Movie+7', 'https://example.com/videos/movie-7.mp4'),
('Interstellar', 'Explorers travel through a wormhole searching for humanity’s new home.', 'Sci-Fi', 'https://placehold.co/300x450/png?text=Movie+8', 'https://example.com/videos/movie-8.mp4'),
('Fight Club', 'An unhappy office worker creates an underground fighting club.', 'Thriller', 'https://placehold.co/300x450/png?text=Movie+9', 'https://example.com/videos/movie-9.mp4'),
('Gladiator', 'A betrayed Roman general seeks revenge as a gladiator.', 'Action', 'https://placehold.co/300x450/png?text=Movie+10', 'https://example.com/videos/movie-10.mp4');

```

### 3. Start the API

Choose one of the following options.

**Docker:** Set `DB_HOST=db` in `.env`, then run:

```sh
docker compose up --build -d backend
```

The supplied Dockerfile runs `npm run start:dev`. Source files are copied into the image, so rebuild the backend image after editing local code.

**Local development:** Set `DB_HOST=localhost` in `.env`, then run:

```sh
npm ci
npm run start:dev
```

The API is available at [http://localhost:3000](http://localhost:3000), and interactive Swagger documentation is available at [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

To stop the Docker services while retaining database data:

```sh
docker compose down
```

## Database schema

The tables have no foreign-key relationships. Movies are shared catalog entries with no user ownership field.

### `users`

| Column | PostgreSQL type | Constraints / behavior |
| --- | --- | --- |
| `id` | `integer` | Generated primary key |
| `email` | `varchar` | Required, unique |
| `password` | `varchar` | Required, unique; stores a bcrypt hash |
| `created_at` | `timestamptz` | Creation timestamp managed by TypeORM |
| `updated_at` | `timestamptz` | Update timestamp managed by TypeORM |
| `user_role` | `varchar` | User role |

### `movies`

| Column | PostgreSQL type | Constraints / behavior |
| --- | --- | --- |
| `id` | `integer` | Generated primary key |
| `title` | `varchar(255)` | Required |
| `description` | `text` | Required |
| `genre` | `varchar(255)` | Required |
| `thumbnail_url` | `text` | Required |
| `video_url` | `text` | Required |
| `created_at` | `timestamptz` | Creation timestamp managed by TypeORM |
| `updated_at` | `timestamptz` | Update timestamp managed by TypeORM |

## Auth flow

### 1. Registration

The user can use the `POST /auth/register` to create a regular user, or the `POST /auth/register/admin` to create an administrator. Both registration endpoints are currently public. The controller assigns the role based on the endpoint.

The request is validated to ensure the email is valid and the password contains at least eight characters. `AuthService` checks whether the email is already registered and returns a `ConflictException` if it is. Otherwise, it hashes the password with bcrypt using 12 salt rounds and saves the email, password hash, and role in PostgreSQL. The response contains the user's ID and email.

### 2. Login

The user can use the `POST /auth/login` to login into the service. `AuthService` finds the user by email and compares the supplied password with the stored bcrypt hash. An unknown email or incorrect password returns an `UnauthorizedException`.

After successful verification, the service signs a JWT using `JWT_SECRET` from the environment. The token contains `sub` (the user's ID), `email`, and `role`, and expires after one hour. The global response interceptor returns it in the `data` field and the user can use the `api/streaming` endpoints depending on their role.

### 3. Accessing protected endpoints

For every request to `/api/streaming`, the client includes the JWT in the authorization header:

```http
Authorization: Bearer <jwt-token>
```

`AuthGuard` runs first. It checks the header format and verifies the token's signature and expiration using the configured JWT secret. Missing, malformed, invalid, or expired tokens return an `UnauthorizedException`. A valid token's decoded payload is attached to `request.user`.

`RoleGuard` then reads the roles configured by the endpoint's `@Roles()` decorator and compares them with `request.user.role`. A role that is not allowed returns an `ForbiddenException`. The guard also rejects routes without configured roles.

| Endpoint | Allowed roles |
| --- | --- |
| `GET /api/streaming` | User, Admin |
| `GET /api/streaming/:id` | User, Admin |
| `GET /api/streaming/:id/play` | User, Admin |
| `POST /api/streaming` | Admin |
| `PATCH /api/streaming/:id` | Admin |
| `DELETE /api/streaming/:id` | Admin |

Once both guards pass, the controller calls the service to perform the requested operation. Role checks use the role stored in the JWT rather than querying the user record on each request. 

## Test instructions

To run the tests, execute the following command from the project root directory:

```sh
npm run test
```

## Swagger UI instructions
To use the UI navigate to [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

In order to use any of the `api/streaming` endpoints the user must login first using the `POST /auth/login`. If it is the first time running the application, you must first register a user (admin or not) before trying to login. Once the user(s) are registered then you can log in and use the different endpoints depending on the user's role.

All endpoints have a title, description and example data for easier testing.

## Key decisions

### 1. Use repositories for database access

**Decision:** Inject TypeORM repositories into the services instead of using an `EntityManager` directly. Each service works with a specific entity, so repositories keep database operations focused and the code simple. They also make it straightforward to mock database access in unit tests.

**Tradeoff:** Operations involving multiple entities need additional transaction handling. For example, a future review feature might need to save a review and update the movie's review count together. A transaction-scoped `EntityManager` would help coordinate those operations so that either both succeed or both are rolled back.

### 2. Load movie records on demand through pagination

**Decision:** Retrieve one page of movies at a time instead of loading the entire catalog into application memory. The service uses TypeORM's `skip`, `take`, and `findAndCount()` methods, with optional genre filtering performed in PostgreSQL. This reduces the number of records transferred and held in memory per request.

**Tradeoff:** Clients must make additional requests to retrieve more pages, and counting all matching records adds database work. Offset pagination can also become slower for later pages in a large catalog, where cursor-based pagination may be a better choice.

### 3. Use PATCH for partial movie updates

**Decision:** Use `PATCH /api/streaming/:id` because clients should be able to update individual movie fields without sending the full resource. `UpdateMovieDTO` extends `PartialType(CreateMovieDTO)`, making the fields optional. The service merges the supplied fields into the existing movie before saving it, preserving omitted fields.

**Tradeoff:** Clients must distinguish between omitting a field and explicitly supplying a value. Validation must also account for optional fields and whether clearing a field is allowed. A `PUT` endpoint would better express replacing the full resource, but would require clients to send its complete editable representation.

## Bug fix documentation

**Part 1 - Bug 1**

- *Location* - The first bug occured at this part of the code:

```
const authHeader = request.headers['authorization'];
const token = authHeader.split(' ')[1];
```

- *Bug Explaination* - If the incoming HTTP request doesn't contain an Authorization header, then authHeader will be undefined and the .split() function will throw a runtime error. Additionally, the code assumes that the header always follows the expected format: Bearer token and never check if that is right.
- *Fix*

```
const authHeader = request.headers['authorization'];

//Check whether the authorization header exists in the request
if (typeof authHeader !== 'string'){
    throw new UnauthorizedException('Missing authorization header');
}

const parts = authHeader.split(' ');

//Check if the header has the format of 'Bearer token'
if (parts.length !==2 || parts[0] !== 'Bearer' || !parts[1]) {
    throw new UnauthorizedException('Invalid authorization header');
}

const token = parts[1];
```

- *Fix Explaination* - This solution:
  - Prevents .split() from being called on undefined or another non-string value.
  - Ensures the header contains exactly two parts.
  - Validates that the authentication scheme is Bearer.
  - Ensures that the token is not empty.
  - Rejects malformed headers containing extra spaces or additional values.

**Part 1 - Bug 2**
- *Location* - The second bug occured at this part of the code:

```
const decoded = this.jwtService.verify(token, { secret: 'secret123' });
```

- *Bug Explaination* - There are two main issues. First the secret is hardcoded in the code so anyone with access to the code can see it. And second the used secret is weak.
- *Fix*

```
const decoded = this.jwtService.verify(token);
```

- *Fix Explaination* - For this solution is saved the secret as an evironment variable and used the ```openssl rand -hex 32``` command to generate a stronger key.

**Part 1 - Bug 3**
- *Location* - The third bug is caused by the try-catch block of the code:

```
try {
const decoded = this.jwtService.verify(token, { secret: 'secret123' });
request.user = decoded;
} catch (err) {
console.error(err);
}
return true;
```

- *Bug Explaination* - The main issue here is that if an error occurs during the JWT verification process, the code will throw an error in the console, but it will send a true value to the client.
- *Fix*

```
try {
    const decoded = this.jwtService.verify(token);

    request.user = decoded;
    return true;

} catch (err) {
    console.error(err);
    throw new UnauthorizedException('An eeror occured during authorization verification.');
}
```

- *Fix Explaination* - This solution:
  - Ensures that true is returned only all processes are successfull.
  - If an error occurs,  NestJS stops the request and returns an HTTP 401 response with useful error context while also printing the error in the console.

**Part 2 -  Performance issue**

**Problem**

The original findAll() controller method retrieved all movie records from the database using streamingService.findAll() and then filtered them by genre in memory using JavaScript's .filter() method, this becomes increasingly inefficient as the number of records grows. Even when only a few movies match the requested genre, the application still retrieves every record from the database.

**Impact Under Load**

As the database grows and more users access the endpoint simultaneously, the original implementation could cause several performance issues:

- **High memory consumption**: Every request loads the entire movie dataset into application memory, regardless of how many records match the requested genre.
- **Increased CPU usage**: Filtering is performed by the Node.js application instead of the database, requiring additional processing for every request.
- **Unnecessary database and network overhead**: Large amounts of data are transferred from PostgreSQL to the application, even when most records are not needed.
- **Slower response times**: Requests take longer to complete as the dataset grows, potentially causing increased latency and timeouts.
- **Poor scalability**: Under heavy concurrent traffic, excessive memory and CPU usage could overwhelm the application, potentially leading to memory exhaustion or service instability.

**Solution**

To address these issues, I moved the filtering logic from the controller into the service layer and implemented database-level filtering and server-side pagination using TypeORM.

The updated implementation uses:

- **where**: Filters records directly in PostgreSQL, ensuring that only movies matching the requested genre are retrieved.

- **skip and take**: Implement offset-based pagination, limiting the number of movie records returned per request.

- **findAndCount()**: Retrieves the requested page of movies along with the total number of matching records.

- **order**: Ensures consistent ordering of results by movie ID.

The endpoint also accepts optional page, limit, and genre query parameters, with default values of 1 and 20 for pagination. Additionally, the response includes pagination metadata such as the total number of matching movies, total pages, and whether previous or next pages are available.
