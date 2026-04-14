# Product Inventory Management System

A complete, modern Product Inventory Management System built with React.js + Tailwind CSS (Frontend) and Node.js + Express + MongoDB (Backend).

## Features

### Backend (REST API)
- **GET /api/products** - Get all products with filtering, sorting, and pagination
- **POST /api/products** - Create a new product
- **PUT /api/products/:id** - Update a product
- **DELETE /api/products/:id** - Delete a product
- **GET /api/products/low-stock** - Get low stock products
- **GET /api/products/stats/inventory** - Get inventory statistics

#### Product Schema
```json
{
  "_id": "string",
  "productName": "string (required)",
  "companyName": "string (required)",
  "category": "string (required)",
  "price": "number (PKR)",
  "currency": "PKR",
  "stockQuantity": "number",
  "piecesPerUnit": "number (optional)",
  "unit": "string (optional)",
  "description": "string (optional)",
  "imageUrl": "string (optional)",
  "isActive": "boolean",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Frontend

#### Views
1. **Grid View** - Beautiful product cards with images, hover effects, and detailed information
2. **Table View** - Professional inventory table with sorting, filtering, and responsive design

#### Features
- **Search** - Search by product name, company name, or category
- **Filters** - Filter by:
  - Stock Status (In Stock, Low Stock, Out of Stock)
  - Category
  - Company
  - Price Range (Min/Max in PKR)
- **Sorting** - Sort by name, date added, price, or stock quantity
- **Add Product** - Modal form to add new products with all fields
- **Delete Product** - Confirmation dialog before deletion
- **Responsive Design** - Works on mobile and desktop
- **Loading States** - Skeleton loaders for better UX
- **Empty State** - Helpful message when no products are found
- **Stock Color Coding**:
  - 🟢 Green - Good stock (> 20)
  - 🟠 Orange - Low stock (1-20)
  - 🔴 Red - Out of Stock (0)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account or local MongoDB instance

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
```

4. Start the server:
```bash
npm run dev
```

Server will run at `http://localhost:8080`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:8080/api
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run at `http://localhost:5173` (Vite default)

### Seed Sample Data

To populate the database with sample Pakistani products:

```bash
curl -X POST http://localhost:8080/api/seed/products
```

Or use Postman/Thunder Client to send a POST request to `http://localhost:8080/api/seed/products`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | Get all products (supports query params) |
| POST | /api/products | Create a new product |
| GET | /api/products/:id | Get a single product |
| PUT | /api/products/:id | Update a product |
| DELETE | /api/products/:id | Delete a product |
| GET | /api/products/low-stock | Get low stock products |
| GET | /api/products/stats/inventory | Get inventory statistics |

### Query Parameters for GET /api/products
- `search` - Search term for product/company/category
- `category` - Filter by category
- `company` - Filter by company name
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `stockStatus` - Filter by stock status (in-stock, low-stock, out-of-stock)
- `sortBy` - Sort field (productName, price, stockQuantity, createdAt)
- `sortOrder` - Sort order (asc, desc)
- `page` - Page number for pagination
- `limit` - Number of items per page

## Project Structure

```
e-shop/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/ui/     # shadcn/ui components
│   │   ├── pages/
│   │   │   └── ProductsPage.tsx    # Main products page
│   │   ├── services/
│   │   │   └── productApi.ts       # API service
│   │   ├── types/
│   │   │   └── product.ts          # TypeScript types
│   │   └── ...
│   └── package.json
├── server/                    # Node.js Backend
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/
│   │   └── productController.js    # Product CRUD logic
│   ├── models/
│   │   └── Product.js          # Product model
│   ├── routes/
│   │   ├── productRoutes.js    # Product routes
│   │   └── seedRoutes.js       # Seed data routes
│   ├── utils/
│   │   └── seedProducts.js     # Sample data
│   └── server.js               # Main server file
└── README-Inventory-System.md
```

## Technologies Used

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- shadcn/ui components
- React Query (TanStack Query) for data fetching
- React Router for navigation
- Zustand for state management
- Lucide React for icons

### Backend
- Node.js with Express
- MongoDB with Mongoose
- CORS for cross-origin requests
- Express JSON middleware

## Screenshots

### Grid View
![Grid View](screenshots/grid-view.png)

### Table View
![Table View](screenshots/table-view.png)

### Add Product Modal
![Add Product](screenshots/add-product.png)

## Future Enhancements

- [ ] Product image upload with Cloudinary
- [ ] Edit product functionality
- [ ] Bulk import/export with CSV/Excel
- [ ] Inventory reports and analytics
- [ ] Low stock email notifications
- [ ] Product barcode/QR code support
- [ ] Multi-warehouse support
- [ ] Stock movement history
- [ ] Role-based access control

## License

MIT License - Feel free to use for personal or commercial projects.

---

Built with ❤️ for Pakistani businesses
