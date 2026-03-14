# UniServe

UniServe is a full-stack canteen management system for school use. It includes:

- `Admin` tools for dashboard analytics, menu management, inventory, users, reports, and settings
- `Cashier` tools for POS and order queue processing
- `Customer` tools for browsing the menu and tracking orders

This repository contains:

- `backend/` - Laravel 12 REST API
- `frontend/` - React + Vite SPA

## Tech Stack

- Backend: Laravel 12, Sanctum, MySQL
- Frontend: React 19 style app structure, Vite 8, Tailwind CSS 4
- Charts: Recharts
- UI: shadcn-based components plus custom app shell

## Core Modules

- Authentication and role-based access
- Dashboard analytics
- Menu management
- POS and order queue
- Inventory tracking
- Sales reports
- Customer ordering and order history
- Settings and generated profile avatars

## Prerequisites

Install these first:

- PHP 8.2+
- Composer
- Node.js 20+
- npm
- MySQL 8+

Recommended local ports:

- Backend API: `http://localhost:8000`
- Frontend app: `http://localhost:5173`

## Project Structure

```text
Canteen-Management-System/
  backend/
  frontend/
  .docs/
```

## Fresh Clone Setup

### 1. Clone the project

```bash
git clone <repository-url>
cd Canteen-Management-System
```

### 2. Backend setup

Run these commands from `backend/`:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Update your `.env` database values:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=backend
DB_USERNAME=root
DB_PASSWORD=
```

Optional admin override:

```env
SUPER_ADMIN_EMAIL=admin@canteen.test
SUPER_ADMIN_PASSWORD=password
```

Then run:

```bash
php artisan migrate --seed
php artisan storage:link
```

### 3. Frontend setup

Run these commands from `frontend/`:

```bash
cd ../frontend
npm install
```

If needed, create or update your frontend environment file:

```env
VITE_API_URL=http://localhost:8000/api
```

## Running the Project

### Option A: Start backend and frontend separately

Backend:

```bash
cd backend
php artisan serve
```

Frontend:

```bash
cd frontend
npm run dev
```

### Option B: Start both from Laravel

From `backend/`:

```bash
composer dev
```

## Access URLs

- Frontend app: `http://localhost:5173`
- Backend API: `http://localhost:8000`

## Demo Accounts

After seeding, these accounts are available by default:

- Admin: `admin@canteen.test` / `password`
- Cashier: `cashier@canteen.test` / `password`
- Customer: `customer@canteen.test` / `password`

If you set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in `.env`, the seeded admin account uses those values instead.

## Important: Menu Images on a Fresh Clone

To make seeded menu images display correctly on another machine, **all three conditions below must be true**:

1. The repo must include the seeded image files under:

```text
backend/storage/app/public/menu-items/
```

2. Laravel storage must be linked:

```bash
cd backend
php artisan storage:link
```

3. The database must be seeded:

```bash
php artisan migrate --seed
```

### How seeded images work

- Seeded menu items now point to fixed image paths inside `storage/app/public/menu-items`
- The API exposes image URLs through Laravel's public storage URL
- `php artisan storage:link` creates the required public symlink:

```text
backend/public/storage -> backend/storage/app/public
```

### If images are not showing

Check these in order:

1. Confirm the image files exist:

```text
backend/storage/app/public/imports
```

2. Recreate the storage symlink:

```bash
cd backend
php artisan storage:link
```

3. Reseed the database if needed:

```bash
php artisan db:seed
```

4. Confirm the frontend API URL points to the correct backend:

```env
VITE_API_URL=http://localhost:8000/api
```

## Useful Commands

### Backend

```bash
cd backend
php artisan route:list --path=api
php artisan test
php artisan migrate:fresh --seed
php artisan storage:link
php vendor/bin/pint
php vendor/bin/pint --test
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

## Production Build Check

Before submission or deployment, verify both apps:

Backend:

```bash
cd backend
php artisan test
php vendor/bin/pint --test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Troubleshooting

### Backend not reachable

If the frontend shows API connection errors:

```bash
cd backend
php artisan serve
```

Also confirm:

- `VITE_API_URL=http://localhost:8000/api`

### Menu images are broken

Run:

```bash
cd backend
php artisan storage:link
php artisan db:seed
```

Then make sure `backend/storage/app/public/menu-items` exists in your clone.

### Blank or empty reports page

Sales Reports defaults to the last 7 days. If your seeded or local data is outside that range, choose a wider date range using the report filters.

## Submission Notes

For school submission, the safest flow is:

1. Clone the repo
2. Configure backend `.env`
3. Run `composer install`
4. Run `php artisan migrate --seed`
5. Run `php artisan storage:link`
6. Run `npm install`
7. Run `npm run dev`
8. Log in using one of the seeded demo accounts

## License / Usage

This repository is intended for academic and project submission use unless your team defines a separate license.
