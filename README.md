### Performance issue

#### Problem

The original findAll() controller method retrieved all movie records from the database using streamingService.findAll() and then filtered them by genre in memory using JavaScript's .filter() method, this becomes increasingly inefficient as the number of records grows. Even when only a few movies match the requested genre, the application still retrieves every record from the database.

#### Impact Under Load

As the database grows and more users access the endpoint simultaneously, the original implementation could cause several performance issues:
* **High memory consumption**: Every request loads the entire movie dataset into application memory, regardless of how many records match the requested genre.
* **Increased CPU usage**: Filtering is performed by the Node.js application instead of the database, requiring additional processing for every request.
* **Unnecessary database and network overhead**: Large amounts of data are transferred from PostgreSQL to the application, even when most records are not needed.
* **Slower response times**: Requests take longer to complete as the dataset grows, potentially causing increased latency and timeouts.
* **Poor scalability**: Under heavy concurrent traffic, excessive memory and CPU usage could overwhelm the application, potentially leading to memory exhaustion or service instability.

#### Solution

To address these issues, I moved the filtering logic from the controller into the service layer and implemented database-level filtering and server-side pagination using TypeORM.

The updated implementation uses:

* **where**: Filters records directly in PostgreSQL, ensuring that only movies matching the requested genre are retrieved.

* **skip and take**: Implement offset-based pagination, limiting the number of movie records returned per request.

* **findAndCount()**: Retrieves the requested page of movies along with the total number of matching records.

* **order**: Ensures consistent ordering of results by movie ID.

The endpoint also accepts optional page, limit, and genre query parameters, with default values of 1 and 20 for pagination. Additionally, the response includes pagination metadata such as the total number of matching movies, total pages, and whether previous or next pages are available.