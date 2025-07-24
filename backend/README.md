# Backend Developer Documentation

## Overview
This backend powers the Modern Pharmacy Management System. It is built with Laravel and provides RESTful APIs for all pharmacy, inventory, sales, reporting, and user management features.

---

## Setup
1. `cd backend`
2. `composer install`
3. Copy `.env.example` to `.env` and configure DB, mail, etc.
4. `php artisan migrate --seed`
5. `php artisan serve` (or use Docker)

---

## Architecture
- **Controllers:** All business logic in `app/Http/Controllers` (RESTful, validated, documented).
- **Models:** Eloquent models in `app/Models` (relationships, scopes, mutators).
- **Policies:** Access control in `app/Policies`.
- **Migrations/Seeders:** DB schema in `database/migrations`, initial data in `database/seeders`.
- **Providers:** Service registration and bootstrapping in `app/Providers`.
- **Imports/Commands:** Data importers and custom artisan commands.

---

## API Conventions
- **Authentication:** Laravel Sanctum, JWT, session-based, role-aware.
- **Validation:** All input is validated in controllers; errors return 422 with details.
- **RESTful:** Use standard HTTP verbs and status codes.
- **Error Handling:** Consistent JSON error responses; log all exceptions.
- **Pagination:** Use `per_page` and `page` query params for list endpoints.
- **Filtering/Sorting:** Use query params for filtering, sorting, and searching.

---

## Security
- **Auth:** All sensitive endpoints require authentication and role checks.
- **Password Policy:** Enforced in registration and password change flows.
- **Audit Logs:** All critical actions are logged.
- **Device/Session:** Device fingerprinting and session management for extra security.

---

## Extensibility
- **Add a Feature:**
  1. Create a new controller/model/migration as needed.
  2. Add routes in `routes/api.php`.
  3. Add/extend policies for access control.
  4. Write tests in `tests/`.
  5. Document new endpoints (OpenAPI/Swagger).
- **Best Practices:**
  - Use Eloquent relationships and scopes.
  - Validate all input.
  - Use policies for all resource access.
  - Write PHPDoc for all methods.
  - Keep controllers thin; use services for complex logic.

---

## Testing
- Run `php artisan test` for all PHPUnit tests.
- Add tests for new features and bug fixes.

---

## Troubleshooting
- **DB Issues:** Check `.env` and run `php artisan migrate:fresh --seed`.
- **API Errors:** See logs in `storage/logs/laravel.log`.
- **Auth Issues:** Check token/session, user roles, and device fingerprinting.

---

## Contribution
- PRs welcome! Please follow code style and add tests/docs for new features.
- For shared context and user documentation, see the main project `README.md`.