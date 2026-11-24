# VELORA — React E-commerce Front-End

## 1. Project map

```text
velora-react/
├── index.html                  # The HTML page that hosts React
├── package.json                # Dependencies and run/build commands
├── vite.config.js              # Vite development/build configuration
├── README.md                   # Setup and project guide
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Main layout and page routes
    ├── styles.css              # Global design, responsive rules, light/dark themes
    ├── data/
    │   └── products.js         # Product catalogue (76 products)
    ├── context/
    │   └── StoreContext.jsx    # Shared cart, wishlist, theme and toast state
    ├── components/
    │   ├── Header.jsx          # Navigation, search, cart count, theme switch
    │   ├── Footer.jsx          # Shared footer
    │   ├── Toast.jsx           # Small feedback notification
    │   └── ProductCard.jsx     # Product card, product grid, section heading
    └── pages/
        ├── Home.jsx            # Home page / hero and featured products
        ├── Listing.jsx         # Women, Men, Collection, Sale and New Arrivals
        ├── ProductDetail.jsx   # Single product page
        ├── Cart.jsx            # Shopping bag and totals
        └── Contact.jsx         # Contact form
```

