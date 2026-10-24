# System Architecture: A2ZEE MicroGreenz

A high-level, clear overview of the architecture, data flow, and components powering the **A2ZEE MicroGreenz** Progressive Web Application (PWA).

![A2ZEE MicroGreenz System Architecture Diagram](./public/system_architecture.jpg)

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client ["Client Layer (Browser / Mobile PWA)"]
        UI["React 18 SPA (Vite)"]
        Router["React Router v7 (HashRouter)"]
        Theme["Tailwind CSS v4 & Radix UI"]
    end

    subgraph StateManagement ["State & Context Layer"]
        AuthCtx["AuthContext (Role & Session)"]
        DataCtx["DataContext (Catalog & Orders)"]
        LocalCache["LocalStorage Fallback / Offline Cache"]
    end

    subgraph Backend ["Backend & Cloud (Firebase BaaS)"]
        FBAuth["Firebase Authentication"]
        Firestore["Cloud Firestore (NoSQL Database)"]
        FBStorage["Firebase Storage (Images/Media)"]
        RealtimeDB["Firebase Realtime Database (Order Tracking)"]
    end

    subgraph External ["External Services & Integrations"]
        Razorpay["Razorpay Payment Gateway"]
        SMTP["SMTPJS / Email Service"]
        WhatsApp["WhatsApp API Service"]
    end

    UI --> Router
    UI --> Theme
    UI --> AuthCtx
    UI --> DataCtx
    AuthCtx <--> LocalCache
    DataCtx <--> LocalCache

    AuthCtx <--> FBAuth
    DataCtx <--> Firestore
    DataCtx <--> RealtimeDB
    UI <--> FBStorage

    DataCtx --> Razorpay
    DataCtx --> SMTP
    DataCtx --> WhatsApp
```

---

## 2. Core Architectural Layers

### A. Presentation & UI Layer
* **Framework**: React 18 with TypeScript and Vite bundler.
* **Routing**: React Router v7 using `HashRouter` for static host compatibility (GitHub Pages, Netlify, Firebase Hosting).
* **Styling**: Tailwind CSS v4, Radix UI accessible primitives, Lucide React icons, and Sonner notifications.
* **PWA Features**: Service workers, offline caching, and responsive mobile-first navigation (`BottomNav`).

### B. State & Context Layer
* **`AuthContext`**: Handles user authentication, session persistence, and role-based permissions (`buyer`, `seller`, `admin`, `superadmin`).
* **`DataContext`**: Manages real-time catalog items, curated boxes, cart items, order transactions, and reviews.
* **`localStorage` Fallback**: Dual-layer architecture allowing the application and automated tests to run offline or with mock storage when Firebase is disconnected.

### C. Backend Cloud Services (Firebase)
* **Authentication**: Email/Password, Phone OTP, and Google Sign-in.
* **Cloud Firestore Collections**:
  * `users/`: User profiles, role declarations, and account approval statuses.
  * `products/`: Seller catalog with stock counters, pricing, and approval flags.
  * `orders/`: Multi-seller order documents, line items, shipping addresses, and statuses.
  * `reviews/`: Product ratings and customer reviews.
  * `catalogue_products/` & `curated_boxes/`: Pre-seeded default collections.
* **Firebase Storage**: CDN asset storage for product images and certificates.
* **Firebase Realtime DB**: Fast real-time sync for live order state transitions.

### D. External Services
* **AI Recommendation Agent**:
  * Powered by Google Gemini 2.5 Flash API (`gemini-2.5-flash`).
  * Floating widget with custom A2ZEE smiling mascot avatar (`/ai_mascot.png`).
  * Provides conversational nutritional guidance, tailored product recommendations, recipe ideas, and grow kit advice.
* **Payment Processing**: Razorpay checkout modal supporting UPI, Credit/Debit cards, Net Banking, and Cash on Delivery (COD).
* **Communication**:
  * SMTPJS for automated order receipts and transactional emails.
  * WhatsApp API redirect for customer care and order dispatch messaging.

---

## 3. Role-Based Access Control (RBAC)

```mermaid
flowchart TD
    User([User Enters App]) --> AuthCheck{Authenticated?}
    AuthCheck -- No --> Landing["Landing Page / Auth Portal"]
    AuthCheck -- Yes --> RoleSwitch{User Role}

    RoleSwitch -- "buyer" --> BuyerFlow["Buyer Portal (/home, /products, /cart, /orders)"]
    RoleSwitch -- "seller" --> SellerFlow["Seller Portal (/seller/dashboard, /seller/products, /seller/orders)"]
    RoleSwitch -- "admin / superadmin" --> AdminFlow["Admin Control (/admin/dashboard, /admin/users, /admin/products)"]
```

* **Buyer**: Browse catalog, add to cart, checkout (Razorpay/COD), track deliveries, review products.
* **Seller**: Inventory management, product listing (pending admin review), order fulfillment (`accepted` → `packed` → `out_for_delivery` → `delivered`).
* **Admin / SuperAdmin**: Seller account approvals, product moderation, customer dispute reviews, financial dashboard.

---

## 4. Order & Payment Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    participant UI as Frontend App
    participant PG as Razorpay / COD
    participant DB as Cloud Firestore
    actor Seller

    Buyer->>UI: Adds products to Cart & proceeds to Checkout
    Buyer->>UI: Submits shipping details & payment method
    alt Razorpay
        UI->>PG: Opens Razorpay Checkout
        PG-->>UI: Payment Success Signature
    else Cash on Delivery
        UI->>UI: Selects COD Mode
    end
    UI->>DB: Atomic transaction creates Order & decrements Stock
    DB-->>Seller: Real-time listener notifies new incoming order
    Seller->>UI: Updates order status (Accepted -> Packed -> Out for Delivery)
    UI->>DB: Updates order status document
    DB-->>Buyer: Live Order Tracking updates instantly
```

---

## 5. CI/CD & Automated Testing Pipeline

```mermaid
flowchart LR
    DevCommit[Code Commit] --> GitPush[Push to GitHub main]
    GitPush --> GHActions[GitHub Actions CI Runner]
    subgraph CI ["Automated CI Pipeline (.github/workflows/ci.yml)"]
        SetupNode[Setup Node 20]
        InstallDeps[Install Dependencies]
        ViteBuild[npm run build]
        StartServer[Start Vite Dev Server]
        SeleniumE2E[Run E2E Suite (Admin, Buyer, Seller)]
        GenReport[Export CSV & Excel Reports]
    end
    GHActions --> SetupNode --> InstallDeps --> ViteBuild --> StartServer --> SeleniumE2E --> GenReport
    GenReport --> Artifacts[(Downloadable Excel Test Artifacts)]
```

* **Build Validation**: Validates Vite production bundle compilation.
* **E2E Automation**: Runs headless Chrome with Selenium WebDriver testing authentic end-to-end user journeys for Admin, Buyer, and Seller roles.
* **Reporting**: Automatically exports detailed `.csv` and styled `.xlsx` reports uploaded directly to GitHub Actions artifacts.
