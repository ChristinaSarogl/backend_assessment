## Bug Documentation

### Part 1

**Bug 1**

* *Location* - The first bug occured at this part of the code:

```
const authHeader = request.headers['authorization'];
const token = authHeader.split(' ')[1];
```

* *Bug Explaination* - If the incoming HTTP request doesn't contain an Authorization header, then authHeader will be undefined and the .split() function will throw a runtime error. Additionally, the code assumes that the header always follows the expected format: Bearer token and never check if that is right.
* *Fix*

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

* *Fix Explaination* - This solution:
  * Prevents .split() from being called on undefined or another non-string value.
  * Ensures the header contains exactly two parts.
  * Validates that the authentication scheme is Bearer.
  * Ensures that the token is not empty.
  * Rejects malformed headers containing extra spaces or additional values.



**Bug 2**
* *Location* - The second bug occured at this part of the code:

```
const decoded = this.jwtService.verify(token, { secret: 'secret123' });
```

* *Bug Explaination* - There are two main issues. First the secret is hardcoded in the code so anyone with access to the code can see it. And second the used secret is weak.
* *Fix*

```
const decoded = this.jwtService.verify(token);
```

* *Fix Explaination* - For this solution is saved the secret as an evironment variable and used the ```openssl rand -hex 32``` command to generate a stronger key.


**Bug 3**
* *Location* - The third bug is caused by the try-catch block of the code:

```
try {
const decoded = this.jwtService.verify(token, { secret: 'secret123' });
request.user = decoded;
} catch (err) {
console.error(err);
}
return true;
```

* *Bug Explaination* - The main issue here is that if an error occurs during the JWT verification process, the code will throw an error in the console, but it will send a true value to the client.
* *Fix*

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

* *Fix Explaination* - This solution:
    - Ensures that true is returned only all processes are successfull.
    - If an error occurs,  NestJS stops the request and returns an HTTP 401 response with useful error context while also printing the error in the console.

### Part 2 -  Performance issue

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
