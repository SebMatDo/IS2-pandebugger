# 🧪 API Testing Guide - Postman

Complete guide to test the Pandebugger API using Postman.

---

## 📋 **Table of Contents**

1. [Installing Postman](#installing-postman)
2. [Initial Setup](#initial-setup)
3. [Authentication Testing](#authentication-testing)
4. [Protected Endpoints Testing](#protected-endpoints-testing)
5. [Complete Endpoint Collection](#complete-endpoint-collection)
6. [Test Automation](#test-automation)
7. [Troubleshooting](#troubleshooting)
8. [Anonymous Login Testing](#anonymous-login-testing)

---

## 📥 **Installing Postman**

### **Download and Install**

**Desktop Application**
- Download from: https://www.postman.com/downloads/
- Available for Windows, macOS, and Linux

## ⚙️ **Initial Setup**

### **Step 1: Create Workspace**

1. Open Postman
2. Click on "Workspaces" (top left corner)
3. Click "Create Workspace"
4. Name: `Pandebugger Development`
5. Visibility: `Personal` (or `Team` if working with a team)
6. Click "Create"

### **Step 2: Create Collection**

1. In the left panel, click on "Collections"
2. Click "+" or "Create Collection"
3. Name: `Pandebugger API`
4. Description: `API endpoints for Pandebugger book digitalization system`

### **Step 3: Configure Environment**

Environments allow you to easily switch between development, testing, and production.

1. Click on **⚙️ (Settings)** icon → "Environments"
2. Click "+" to create new environment
3. Name: `Local Development`

4. **Add variables:**

| Variable | Initial Value | Current Value | Type |
|----------|---------------|---------------|------|
| `base_url` | `http://localhost:3000/api/v1` | `http://localhost:3000/api/v1` | default |
| `auth_token` | (leave empty) | (leave empty) | secret |
| `anonymous_token` | (leave empty) | (leave empty) | secret |

5. Click "Save"
6. **Select the environment** "Local Development" from the dropdown (top right corner)

### **Verify Configuration**

You should see in the top right corner:
```
Environment: Local Development
```

---

## 🔐 **Authentication Testing**

### **Step 4: Login Request**

This is the most important endpoint, as you get the JWT token needed to access protected endpoints.

#### **Create the Request**

1. In your "Pandebugger API" collection, click **"Add request"**
2. Name: `Auth - Login`
3. Configure:

**Method:** `POST`

**URL:** `{{base_url}}/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:** (select "raw" and "JSON")
```json
{
  "email": "admin@pandebugger.com",
  "password": "Test123!"
}
```

#### **Script to Automatically Save Token**

In the **"Tests"** tab of the request, paste this code:

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("auth_token", response.data.token);
    console.log("Token saved:", response.data.token);
}
```

## 🔒 **Protected Endpoints Testing**

Protected endpoints require the JWT token in the `Authorization` header.

### **Step 5: Get Current User (GET /auth/me)**

This endpoint returns the authenticated user's information.

#### **Create the Request**

1. In your collection, click **"Add request"**
2. Name: `Auth - Get Me`
3. Configure:

**Method:** `GET`

**URL:** `{{base_url}}/auth/me`

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

> **Note:** Postman will automatically replace `{{auth_token}}` with the saved value.

### **Step 6: Change Password (POST /auth/change-password)**

Allows changing the authenticated user's password.

**Method:** `POST`

**URL:** `{{base_url}}/auth/change-password`

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "currentPassword": "Test123!",
  "newPassword": "NewPass456!"
}
```

> ⚠️ **Note:** If you change the password, you'll need to login again with the new password.

---

## 📚 **Complete Endpoint Collection**

### **Authentication Module**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/login` | POST | ❌ No | Login and get JWT token |
| `/auth/login-anonymous` | POST | ❌ No | Anonymous login (Lector role) |
| `/auth/me` | GET | ✅ Yes | Get current user information |
| `/auth/change-password` | POST | ✅ Yes | Change password |
| `/auth/restore-password` | POST | ❌ No | Restore password (TODO) |

### **Health Check**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | ❌ No | Basic health check |
| `/health/readiness` | GET | ❌ No | Readiness probe (DB check) |

### **Books Module**

| Endpoint | Method | Auth | Roles | Description |
|----------|--------|------|-------|-------------|
| `/books` | GET | ✅ Yes | All (including Lector) | List books |
| `/books/:id` | GET | ✅ Yes | All (including Lector) | Get book by ID |
| `/books/states` | GET | ❌ No | Public | Get all book states |
| `/books/categories` | GET | ❌ No | Public | Get all categories |
| `/books` | POST | ✅ Yes | Admin, Bibliotecario | Create new book |
| `/books/:id` | PUT | ✅ Yes | Admin, Bibliotecario | Update book |
| `/books/:id` | DELETE | ✅ Yes | Admin, Bibliotecario | Deactivate book |
| `/books/categories` | POST | ✅ Yes | Admin, Bibliotecario | Create category |
| `/books/categories/:id` | PUT | ✅ Yes | Admin, Bibliotecario | Update category |

### **Users Module**

| Endpoint | Method | Auth | Roles | Description |
|----------|--------|------|-------|-------------|
| `/users` | GET | ✅ Yes | Admin, Bibliotecario | List users |
| `/users/:id` | GET | ✅ Yes | Admin, Bibliotecario | Get user by ID |
| `/users/roles` | GET | ✅ Yes | Admin, Bibliotecario | Get all roles |
| `/users` | POST | ✅ Yes | Admin, Bibliotecario | Create user |
| `/users/:id` | PUT | ✅ Yes | Admin, Bibliotecario | Update user |
| `/users/:id` | DELETE | ✅ Yes | Admin, Bibliotecario | Deactivate user |
| `/users/:id/activate` | PATCH | ✅ Yes | Admin, Bibliotecario | Activate user |

### **Tasks Module**

| Endpoint | Method | Auth | Roles | Description |
|----------|--------|------|-------|-------------|
| `/tasks` | GET | ✅ Yes | Admin, Bibliotecario | List tasks |
| `/tasks/:id` | GET | ✅ Yes | Admin, Bibliotecario | Get task by ID |
| `/tasks` | POST | ✅ Yes | Admin, Bibliotecario | Create task |
| `/tasks/:id` | PUT | ✅ Yes | Admin, Bibliotecario | Update task |

### **History Module**

| Endpoint | Method | Auth | Roles | Description |
|----------|--------|------|-------|-------------|
| `/history` | GET | ✅ Yes | Admin, Bibliotecario | Get history with filters |
| `/history/:id` | GET | ✅ Yes | Admin, Bibliotecario | Get history by ID |
| `/history/recent` | GET | ✅ Yes | Admin, Bibliotecario | Get recent activity |
| `/history/user/:id` | GET | ✅ Yes | Admin, Bibliotecario | Get user activity |
| `/history/target/:type/:id` | GET | ✅ Yes | Admin, Bibliotecario | Get target history |
| `/history/acciones` | GET | ✅ Yes | Admin, Bibliotecario | Get all actions |
| `/history/target-types` | GET | ✅ Yes | Admin, Bibliotecario | Get all target types |

---

## 🔄 **Recommended Testing Flow**

### **Execution Order**

1. **Health Check** → Verify server is running
2. **Login** → Get JWT token
3. **Get Me** → Verify authentication
4. **Other protected endpoints** → Test specific functionality

### **Complete Session Example**

```
1. GET  /health                    → 200 OK (server working)
2. POST /auth/login                → 200 OK (token saved automatically)
3. GET  /auth/me                   → 200 OK (authentication successful)
4. GET  /books                     → 200 OK (book list)
5. POST /books                     → 201 Created (book created)
6. GET  /books/11                  → 200 OK (newly created book)
7. PUT  /books/11                  → 200 OK (book updated)
8. GET  /history/recent            → 200 OK (recent activity with target names)
9. POST /auth/change-password      → 200 OK (password changed)
```

---

## 🤖 **Test Automation**

### **Create Test Suite**

Postman allows you to run all requests in sequence automatically.

#### **Collection Runner**

1. Right-click on your "Pandebugger API" collection
2. Select "Run collection"
3. Select the "Local Development" environment
4. Click "Run Pandebugger API"

Postman will execute all requests in order and show the results.

#### **Pre-request Scripts**

To run code before each request:

```javascript
// Pre-request Script (collection level)
console.log("🚀 Executing:", pm.info.requestName);
console.log("📍 URL:", pm.request.url);
console.log("🕐 Timestamp:", new Date().toISOString());
```

## 🧑‍🤝‍🧑 **Testing with Different Users**

### **Available Test Users**

All use password: **`Test123!`**

| Email | Role | Permissions |
|-------|------|-------------|
| admin@pandebugger.com | Admin | All permissions |
| maria.gonzalez@pandebugger.com | Bibliotecario | Book and user management |
| carlos.ramirez@pandebugger.com | Digitalizador | Digitize and upload files |
| ana.martinez@pandebugger.com | Revisor | Quality review |
| luis.fernandez@pandebugger.com | Restaurador | Physical restoration |

### **Testing Permissions by Role**

1. **Duplicate the Login request** (right-click → Duplicate)
2. Rename: "Auth - Login (Bibliotecario)"
3. Change email to `maria.gonzalez@pandebugger.com`
4. Execute and verify you get a different token
5. Use that token to test role-specific endpoints

---

## 🎭 **Anonymous Login Testing**

### **Request: Anonymous Login**

#### **Basic Configuration:**

- **Method:** `POST`
- **URL:** `{{base_url}}/auth/login-anonymous`
- **Headers:**
  ```
  Content-Type: application/json
  ```

### **Body (JSON):**

```json
{}
```

**Note:** The body is empty `{}` because anonymous login doesn't require credentials.

---

## ✅ **Expected Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": null,
      "nombre": "Usuario",
      "apellido": "Anónimo",
      "email": "anonimo@pandebugger.com",
      "rol_id": 6,
      "rol_nombre": "Lector"
    }
  },
  "message": "Login anónimo exitoso"
}
```

---

## 🔧 **Test Scripts in Postman**

In the **Tests** tab of your request, add this code to automatically save the anonymous token:

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    
    // Save anonymous token
    pm.environment.set("anonymous_token", response.data.token);
    
    // Automatic tests
    pm.test("Status code is 200", function () {
        pm.response.to.have.status(200);
    });
    
    pm.test("Response has success true", function () {
        pm.expect(response.success).to.be.true;
    });
    
    pm.test("Token is present", function () {
        pm.expect(response.data.token).to.be.a('string');
        pm.expect(response.data.token.length).to.be.greaterThan(0);
    });
    
    pm.test("User is anonymous (Lector role)", function () {
        pm.expect(response.data.user.rol_nombre).to.eql("Lector");
        pm.expect(response.data.user.email).to.eql("anonimo@pandebugger.com");
        pm.expect(response.data.user.id).to.be.null;
    });
    
    console.log("✅ Anonymous token saved:", response.data.token);
}
```

---

## 🔒 **Testing Access with Anonymous Token**

Once you have the anonymous token, test these endpoints:

### **1. View Published Books (✅ Allowed)**

**GET** `{{base_url}}/books`

**Headers:**
```
Authorization: Bearer {{anonymous_token}}
```

**Expected Response:** List of digitized books (state "Disponible")

---

### **2. View Anonymous User Info (✅ Allowed)**

**GET** `{{base_url}}/auth/me`

**Headers:**
```
Authorization: Bearer {{anonymous_token}}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": null,
    "nombre": "Usuario",
    "apellido": "Anónimo",
    "email": "anonimo@pandebugger.com",
    "rol_id": 6,
    "rol_nombre": "Lector",
    "activo": true
  }
}
```

---

### **3. Try to Create a Book (❌ Forbidden)**

**POST** `{{base_url}}/books`

**Headers:**
```
Authorization: Bearer {{anonymous_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "titulo": "Attempt to create book",
  "isbn": "978-1234567890",
  "categoria_id": 1,
  "estado_id": 1
}
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Anonymous users cannot perform this action"
}
```

---

### **4. Try to Modify a Book (❌ Forbidden)**

**PUT** `{{base_url}}/books/1`

**Headers:**
```
Authorization: Bearer {{anonymous_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "titulo": "Modified title"
}
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Anonymous users cannot perform this action"
}
```

---

## 📋 **Complete Collection in Postman**

Create a folder named **"Auth - Anonymous"** with these requests:

```
📁 Pandebugger API
  📁 Auth
    📄 Login (registered user)
    📄 Login Anonymous ← NEW
    📄 Get Me
    📄 Change Password
  📁 Books
    📄 Get All Books (allows anonymous)
    📄 Get Book by ID (allows anonymous)
    📄 Create Book (rejects anonymous)
    📄 Update Book (rejects anonymous)
    📄 Delete Book (rejects anonymous)
```

---

## 🎯 **Complete Test Flow**

```bash
1. POST /auth/login-anonymous
   ✅ Get anonymous token
   ✅ Token saved in {{anonymous_token}}

2. GET /books
   ✅ With anonymous token → See only published books

3. GET /auth/me
   ✅ With anonymous token → Anonymous user info

4. POST /books
   ❌ With anonymous token → 403 Error

5. PUT /books/1
   ❌ With anonymous token → 403 Error

6. DELETE /books/1
   ❌ With anonymous token → 403 Error
```

---

## 🔄 **Comparison: Regular User vs Anonymous**

| Action | Regular User | Anonymous User |
|--------|-------------|----------------|
| **View published books** | ✅ Yes | ✅ Yes |
| **Create book** | ✅ Yes (with permissions) | ❌ No |
| **Modify book** | ✅ Yes (with permissions) | ❌ No |
| **Delete book** | ✅ Yes (with permissions) | ❌ No |
| **View history** | ✅ Yes | ❌ No |
| **Manage users** | ✅ Yes (Admin) | ❌ No |
| **Assign tasks** | ✅ Yes (with permissions) | ❌ No |

---

## 💡 **Testing Tips**

1. **Save both tokens:**
   - `{{auth_token}}` - Regular user
   - `{{anonymous_token}}` - Anonymous user

2. **Switch between tokens:**
   - Change the `Authorization` header to test authenticated or anonymous access

3. **Verify expiration:**
   - Anonymous token also expires in 7 days
   - Login again if you receive "Token expired"

---

## 🐛 **Troubleshooting**

### **Error: "Token not provided"**

**Cause:** The `Authorization` header is not configured correctly.

**Solution:**
1. Verify the header is: `Authorization: Bearer {{auth_token}}`
2. Make sure to include the word `Bearer` with a space
3. Verify the variable `{{auth_token}}` has a value (👁️ icon)

### **Error: "Invalid token"**

**Cause:** The token expired or is incorrect.

**Solution:**
1. Run the Login request again
2. Tokens are valid for 7 days by default

### **Error: "ECONNREFUSED"**

**Cause:** The server is not running.

**Solution:**
```bash
# Verify containers are active
docker compose ps

# If not running, start them
docker compose up -d

# View logs
docker compose logs -f app
```

### **Variables Not Replaced**

**Cause:** Environment is not selected.

**Solution:**
1. Verify "Local Development" is selected (top right corner)
2. Variables must be in format `{{variable_name}}`

### **Tests Fail**

**Cause:** Response is not as expected.

**Solution:**
1. Check the "Console" tab (bottom) to see detailed logs
2. Verify HTTP status code
3. Review response body

---

## 🎯 **Complete Example: Testing Flow**

### **Scenario: Create a New Book**

1. **Login as Admin:**
```
POST {{base_url}}/auth/login
Body: { "email": "admin@pandebugger.com", "password": "Test123!" }
```

2. **Verify authentication:**
```
GET {{base_url}}/auth/me
Headers: Authorization: Bearer {{auth_token}}
```

3. **Create book:**
```
POST {{base_url}}/books
Headers: Authorization: Bearer {{auth_token}}
Body: {
  "titulo": "New Test Book",
  "autor": "Test Author",
  "isbn": "978-1234567890",
  "categoria_id": 1,
  "estado_id": 1
}
```

4. **Verify created book:**
```
GET {{base_url}}/books/11
Headers: Authorization: Bearer {{auth_token}}
```

5. **Check history log:**
```
GET {{base_url}}/history/recent
Headers: Authorization: Bearer {{auth_token}}
```

**Expected:** Should show the book creation with `target_nombre` = "New Test Book"

---

## 📚 **Additional Resources**

- **[Getting Started](./GETTING_STARTED.md)** - Initial project setup
- **[Database Guide](./DATABASE_GUIDE.md)** - Database management
- **[Postman Documentation](https://learning.postman.com/docs/)** - Official documentation
- **[JWT.io](https://jwt.io/)** - Decode JWT tokens

---
