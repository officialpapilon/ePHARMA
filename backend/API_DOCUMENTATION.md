# Pharmacy Management System API Documentation

## Overview
This API provides comprehensive endpoints for managing a pharmacy system including customer management, inventory control, sales processing, and financial tracking.

## Base URL
```
http://localhost:8000/api
```

## Authentication
All protected routes require a Bearer token obtained from the login endpoint.

### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

---

## 🔐 Authentication Endpoints

### Login
```http
POST /login
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```
**Response:**
```json
{
  "success": true,
  "token": "1|abc123...",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "position": "Pharmacist",
    "branch_id": 1,
    "branch_name": "Main Branch"
  }
}
```

### Logout
```http
POST /logout
```

### Get Current User
```http
GET /user
```

---

## 👥 Employee Management

### List Employees
```http
GET /employees
```

### Create Employee
```http
POST /employees
```
**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "password": "password123",
  "position": "Cashier",
  "phone": "+255123456789"
}
```

### Get Employee Positions
```http
GET /employees/positions
```

### Update Employee
```http
PUT /employees/{id}
```

### Toggle Employee Status
```http
POST /employees/{id}/toggle-status
```

### Change Employee Password
```http
POST /employees/change-password
```

---

## 🏥 Customer Management

### List Customers
```http
GET /customers
```

### Create Customer
```http
POST /customers
```
**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+255123456789",
  "email": "john@example.com",
  "address": "123 Main St",
  "age": 30,
  "gender": "Male"
}
```

### Get Customer Details
```http
GET /customers/{id}
```

### Update Customer
```http
PUT /customers/{id}
```

### Delete Customer
```http
DELETE /customers/{id}
```

### Get Customer Transactions
```http
GET /customers/{customerId}/transactions
```

### Get Customer Transaction Summary
```http
GET /customers/{customerId}/transaction-summary
```

### Get Customers with Transactions
```http
GET /customers-with-transactions
```

---

## 💊 Medicine Management

### List Medicines
```http
GET /medicines
```

### Create Medicine
```http
POST /medicines
```
**Request Body:**
```json
{
  "product_name": "Paracetamol",
  "product_category": "Pain Relief",
  "product_unit": "Tablets",
  "product_price": "500.00",
  "unit_price": "50.00"
}
```

### Get Medicine Details
```http
GET /medicines/{id}
```

### Update Medicine
```http
PUT /medicines/{id}
```

### Delete Medicine
```http
DELETE /medicines/{id}
```

---

## 📦 Inventory Management

### List Medicine Cache (Stock)
```http
GET /medicines-cache
```

### Update Medicine Stock
```http
PUT /dispense/{id}
```

### Stock Taking
```http
GET /stock-taking
POST /stock-taking
GET /stock-taking/{id}
PUT /stock-taking/{id}
DELETE /stock-taking/{id}
```

### Stock Adjustments
```http
GET /stock-adjustments
POST /stock-adjustments
GET /stock-adjustments/{id}
PUT /stock-adjustments/{id}
DELETE /stock-adjustments/{id}
```

---

## 🛒 Sales & Transactions

### Cart Management
```http
GET /carts
POST /carts
GET /carts/{id}
PUT /carts/{id}
DELETE /carts/{id}
```

**Create Cart:**
```json
{
  "patient_ID": "1",
  "product_purchased": [
    {
      "product_id": "1",
      "product_quantity": 2,
      "product_price": 500.00
    }
  ],
  "total_price": 1000.00,
  "status": "sent_to_cashier"
}
```

### Payment Approval
```http
GET /payment-approve
POST /payment-approve
GET /payment-approve/{id}
PUT /payment-approve/{id}
DELETE /payment-approve/{id}
```

**Approve Payment:**
```json
{
  "Patient_ID": "1",
  "Product_ID": "1",
  "transaction_ID": "123",
  "approved_quantity": 2,
  "approved_amount": 1000.00,
  "approved_payment_method": "cash",
  "approved_by": "1"
}
```

### Dispensing
```http
POST /dispense/{dispenseId}
```
**Request Body:**
```json
{
  "created_by": "1"
}
```

### Dispensed Records
```http
GET /dispensed
POST /dispensed
GET /dispensed/{id}
PUT /dispensed/{id}
DELETE /dispensed/{id}
GET /dispensed-statistics
```

---

## 💰 Financial Management

### Financial Activities
```http
GET /financial-activities
POST /financial-activities
GET /financial-activities/{id}
PUT /financial-activities/{id}
DELETE /financial-activities/{id}
```

**Create Financial Activity:**
```json
{
  "type": "expense",
  "amount": 5000.00,
  "category": "Utilities",
  "description": "Electricity bill",
  "date": "2025-01-15"
}
```

### Financial Summary
```http
GET /financial-activities/summary
GET /financial-activities/dashboard
GET /financial-activities/categories
POST /financial-activities/categories
```

### Cashier Dashboard
```http
GET /cashier-dashboard
```

---

## 📊 Reports & Analytics

### Dispensing Report
```http
GET /dispensing-report
```

### Payment Methods
```http
GET /payment-methods
```

---

## ⚙️ Settings & Configuration

### Pharmacy Settings
```http
GET /settings/pharmacy
POST /settings/pharmacy/info
POST /settings/pharmacy/dispensing
POST /settings/pharmacy/upload-image
POST /settings/pharmacy/remove-image
POST /settings/pharmacy/departments
POST /settings/pharmacy/payment-options
POST /settings/pharmacy/reset
```

---

## 🏢 Pharmacy & Branch Management

### Pharmacy Management
```http
GET /pharmacies
POST /pharmacies
GET /pharmacies/{id}
PUT /pharmacies/{id}
DELETE /pharmacies/{id}
```

### Branch Management
```http
GET /pharmacies/{pharmacy}/branches
POST /pharmacies/{pharmacy}/branches
GET /branches/{branch}
PUT /branches/{branch}
DELETE /branches/{branch}
POST /branches/{branch}/activate
POST /branches/{branch}/deactivate
```

---

## 📁 File Management

### Pharmacy Images
```http
GET /storage/pharmacy_images/{filename}
```

---

## 🔄 User Subscriptions

### Subscribe User
```http
POST /users/{user}/subscribe
```

### Check Subscription
```http
GET /users/{user}/subscription
```

---

## 📝 Error Responses

### Validation Error (422)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field": ["The field is required."]
  }
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (in debug mode)"
}
```

---

## 🚀 Development Notes

### Route Organization
- Routes are organized by functional areas
- Authentication middleware is applied to protected routes
- Resource routes follow RESTful conventions
- Custom routes are grouped logically

### Best Practices
- Always include proper error handling
- Use validation for all input data
- Return consistent response formats
- Include pagination for list endpoints
- Use proper HTTP status codes

### Future Enhancements
- Add rate limiting
- Implement API versioning
- Add comprehensive logging
- Enhance security measures
- Add bulk operations
- Implement webhooks 