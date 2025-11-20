# API Examples

Collection of example API requests for testing the Pandebugger API.

## Health Checks

### Basic Health Check
```sh
curl http://localhost:3000/api/v1/health
```

### Readiness Check
```sh
curl http://localhost:3000/api/v1/health/readiness
```

## Using Postman

Import this as a Postman collection:

```json
{
  "info": {
    "name": "Pandebugger API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Get All Books",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/books"
      }
    },
    {
      "name": "Create Book",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/books",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Example Book\",\n  \"author\": \"John Doe\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api/v1"
    }
  ]
}
```

## Testing with JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch('http://localhost:3000/api/v1/books', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Test Book',
    author: 'Test Author',
  }),
});

const data = await response.json();
console.log(data);
```
