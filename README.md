# 🚗 V-Track — Manage-Every-Mile-Every-Expense

V-Track is a premium, full-stack MERN application designed for tracking vehicle expenses, fuel consumption, and mileage trends. Built with a sleek dark glassmorphism design system, it features real-time statistics, geolocation tracking, interactive dashboards, and multi-vehicle garage management.

---

## ✨ Features

- **📊 Comprehensive Dashboard**: 
  - Tracks total costs, overall distance traveled, and cost-per-kilometer across your fleet.
  - Categorized costs breakdown visualizer using interactive Pie Charts.
  - "Quick Add" modals for logging transactions directly from the main feed.
- **⛽ Fuel Department**:
  - Tracks fuel refills, liters filled, price-per-liter, and odometer logs.
  - Calculates vehicle fuel economy (mileage) dynamically between consecutive logs.
  - Visualizes fuel economy and price trends on responsive line charts.
  - GPS-based coordinate reverse-geocoding (OpenStreetMap Nominatim) to save gas station locations.
- **🔧 Combined Expenses Log**:
  - Integrated logs for combined **Maintenance & Service**, **Fastag**, and other expenses.
  - Dynamic client-side filtering by vehicle.
  - View uploads and receipts (attachment links) for each transaction log.
- **🏢 Garage (Fleet Management)**:
  - Add, edit, and delete vehicles including Make/Brand, Model, Year, License Plate, and **Default Fuel Type** (Petrol, Diesel, CNG, Electric).
  - **Dynamic Binding**: When selecting a vehicle in the fuel stop log form, V-Track automatically sets the fuel dropdown to match that vehicle's default fuel type, reducing repetitive inputs.
- **📱 Responsive Glassmorphic Layout**:
  - Mobile-adapted layout with collapsible side-toggle navigation, column adaptations, and scrollable data tables.
  - Sleek visual elements: custom HSL color palette, radial background glow highlights, smooth transitions, and premium fonts (Outfit & Inter).

---

## 🛠️ Technology Stack

- **Frontend**: React (Hooks, Context API), React Router, Vite, Recharts, Lucide-React.
- **Backend**: Node.js, Express, Mongoose, JSON Web Tokens (JWT).
- **Database**: MongoDB.
- **Design System**: Vanilla CSS Glassmorphic panels, CSS variables, Outfit/Inter typography, blur backdrop filters.

---

## 📂 Directory Structure

```text
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components (Spinner, Skeleton, Progress)
│   │   ├── context/            # AuthContext API for credentials management
│   │   ├── pages/              # Core pages (Dashboard, Fuel, Expenses, Garage, Profile)
│   │   ├── config.js           # Reads VITE_API_URL from env
│   │   ├── App.jsx             # Main Router and layout wraps
│   │   ├── index.css           # Premium Glassmorphic design variables and styles
│   │   └── main.jsx
│   ├── .env                    # Frontend environment variables
│   └── vite.config.js          # Vite server and proxy configuration
│
└── server/                     # Express Backend (REST API)
    ├── middleware/             # Auth check middlewares
    ├── models/                 # Database Schemas (User, Vehicle, Expense)
    ├── routes/                 # Express route entrypoints (auth, vehicles, expenses)
    ├── uploads/                # Local receipt file storage
    └── server.js               # Application startup and DB connection
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local server or Atlas cluster URI)

### 📦 Installation & Configuration

1. **Clone the Repository** and open the directory:
   ```bash
   cd "Vehical expance track"
   ```

2. **Configure Backend (`server`)**:
   - Navigate to the server folder:
     ```bash
     cd server
     ```
   - Create a `.env` file:
     ```env
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Run the server in development mode:
     ```bash
     npm run dev
     ```

3. **Configure Frontend (`client`)**:
   - Open a new terminal and navigate to the client folder:
     ```bash
     cd client
     ```
   - Create a `.env` file:
     ```env
     VITE_API_URL=http://localhost:5000
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the Vite dev server:
     ```bash
     npm run dev
     ```
   - Visit the app at `http://localhost:5173`.

---

## 🔒 License & Credits

- Created and Managed by **[Jay Patel](https://jayptlportfolio.netlify.app/)**.
- Standard MIT License.
