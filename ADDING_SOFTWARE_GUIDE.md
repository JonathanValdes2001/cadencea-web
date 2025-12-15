# Adding Software & Effects to Cadencea Website

This guide explains how to add new software products (instruments and effects) and sounds to your Cadencea website. The current system uses mock data that can be easily modified and eventually replaced with a real database.

## Table of Contents
- [Current System Overview](#current-system-overview)
- [Adding New Products](#adding-new-products)
- [Product Data Structure](#product-data-structure)
- [Available Categories](#available-categories)
- [Image/Gradient System](#imagegradient-system)
- [Pricing Configuration](#pricing-configuration)
- [Category Filtering](#category-filtering)
- [Step-by-Step Examples](#step-by-step-examples)
- [Replacing Mock Data with Database](#replacing-mock-data-with-database)
- [Best Practices](#best-practices)

## Current System Overview

The website currently uses a mock data system located in `/app/software/page.tsx`. Products are stored in a JavaScript array and filtered/displayed dynamically based on user selections.

### Key Files:
- `/app/software/page.tsx` - Main software page with mock data
- `/app/software/sounds/page.tsx` - Sounds page (currently coming soon)
- `/components/Navbar.tsx` - Navigation component
- Available gradient classes for product visuals

## Product Data Structure

Each product in the system is an object with the following structure:

```javascript
{
  id: number,              // Unique identifier
  name: string,            // Product name
  category: string,        // 'instruments' or 'effects'
  type: string,           // Product subtype (e.g., 'Synthesizer', 'Reverb')
  price: number,          // Price in euros
  description: string,    // Product description
  image: string,         // Gradient class identifier
  comingSoon: boolean,   // Whether product is available
  featured: boolean      // Whether product is featured (affects sorting)
}
```

### Example Product:
```javascript
{
  id: 7,
  name: 'Quantum Delay',
  category: 'effects',
  type: 'Delay',
  price: 79,
  description: 'Space-time bending delay effect with quantum modulation algorithms.',
  image: 'gradient-blue',
  comingSoon: true,
  featured: false
}
```

## Available Categories

The system currently supports these categories:

### Software Categories:
- `'instruments'` - Synthesizers, samplers, drum machines, etc.
- `'effects'` - Reverbs, delays, compressors, EQs, etc.

### Sound Categories (future):
- `'sounds'` - Sample packs, loops, presets (handled separately)

## Image/Gradient System

Products use gradient backgrounds instead of traditional images. Available gradient classes:

```javascript
const gradientClasses = {
  'gradient-purple': 'from-purple-600 to-purple-800',
  'gradient-blue': 'from-blue-600 to-blue-800',
  'gradient-green': 'from-green-600 to-green-800',
  'gradient-red': 'from-red-600 to-red-800',
  'gradient-orange': 'from-orange-600 to-orange-800',
  'gradient-teal': 'from-teal-600 to-teal-800'
}
```

### Adding New Gradients:
To add a new gradient, modify the `gradientClasses` object in `/app/software/page.tsx`:

```javascript
const gradientClasses = {
  // Existing gradients...
  'gradient-pink': 'from-pink-600 to-pink-800',
  'gradient-yellow': 'from-yellow-600 to-yellow-800',
  'gradient-indigo': 'from-indigo-600 to-indigo-800'
}
```

## Adding New Products

### Step 1: Locate the Mock Data
Open `/app/software/page.tsx` and find the `mockProducts` array (around line 6).

### Step 2: Add Your Product
Add a new product object to the array:

```javascript
const mockProducts = [
  // Existing products...
  {
    id: 8, // Make sure this is unique
    name: 'Your Product Name',
    category: 'instruments', // or 'effects'
    type: 'Synthesizer', // Product subtype
    price: 149,
    description: 'Your product description here.',
    image: 'gradient-purple', // Choose from available gradients
    comingSoon: false, // Set to false when ready to sell
    featured: true // Set to true for featured products
  }
];
```

### Step 3: Update Category Counts
The category filters automatically calculate counts, so no manual updates needed.

### Step 4: Test Your Changes
1. Save the file
2. Refresh your website
3. Check that the product appears in the correct category
4. Test filtering and search functionality

## Step-by-Step Examples

### Example 1: Adding a New Synthesizer

```javascript
{
  id: 9,
  name: 'Nova Synthesizer',
  category: 'instruments',
  type: 'Analog Synthesizer',
  price: 199,
  description: 'Vintage-inspired analog synthesizer with modern digital control.',
  image: 'gradient-purple',
  comingSoon: false,
  featured: true
}
```

### Example 2: Adding a New Effect

```javascript
{
  id: 10,
  name: 'Crystal Reverb',
  category: 'effects',
  type: 'Reverb',
  price: 89,
  description: 'Pristine algorithmic reverb with crystalline clarity and warmth.',
  image: 'gradient-blue',
  comingSoon: true,
  featured: false
}
```

### Example 3: Adding a Drum Machine

```javascript
{
  id: 11,
  name: 'Rhythm Beast',
  category: 'instruments',
  type: 'Drum Machine',
  price: 159,
  description: 'Professional drum machine with authentic analog samples and patterns.',
  image: 'gradient-red',
  comingSoon: false,
  featured: true
}
```

## Pricing Configuration

### Current Pricing Logic:
- Products show "Update" price (your set price)
- "Full Version" price is calculated as `price * 1.5` (rounded)

### To Modify Pricing Logic:
Find this section in `/app/software/page.tsx` (around line 300):

```javascript
<div className="flex items-center space-x-2">
  <span className="text-gray-400 text-sm">Update</span>
  <span className="text-white font-bold">€{product.price}.00</span>
</div>
<div className="flex items-center space-x-2">
  <span className="text-gray-400 text-sm">Full Version</span>
  <span className="text-white font-bold">€{Math.round(product.price * 1.5)}.00</span>
</div>
```

## Category Filtering

The system automatically handles filtering through these categories:
- **All**: Shows all instruments and effects
- **Instruments**: Shows only products with `category: 'instruments'`
- **Effects**: Shows only products with `category: 'effects'`
- **Free**: Currently shows no products (for future free products)

### Adding Free Products:
To make a product appear in the "Free" category, you could:

1. Add a `isFree: boolean` property to products
2. Set `price: 0` for free products
3. Modify the filtering logic to handle free products

## Replacing Mock Data with Database

When you're ready to replace the mock data with a real database, follow these steps:

### Step 1: Choose Your Database Solution
Popular options:
- **Supabase** (already configured in your project)
- **PostgreSQL** with Prisma
- **MongoDB** with Mongoose
- **Firebase Firestore**

### Step 2: Create Database Schema

Example Supabase table schema:
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  type VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image VARCHAR(100),
  coming_soon BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Step 3: Replace Mock Data with API Calls

Replace the `mockProducts` array with a database fetch:

```javascript
// Replace this:
const mockProducts = [...];

// With this:
const [products, setProducts] = useState([]);

useEffect(() => {
  const fetchProducts = async () => {
    try {
      // Using Supabase example
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  fetchProducts();
}, []);
```

### Step 4: Update Filtering Logic

Modify the `filteredProducts` useMemo hook to work with the database data:

```javascript
const filteredProducts = useMemo(() => {
  // Filter to only show instruments and effects
  let filtered = products.filter(product => 
    product.category === 'instruments' || product.category === 'effects'
  );

  // Rest of filtering logic remains the same...
}, [products, activeCategory, searchQuery, sortBy]);
```

### Step 5: Add Product Management

Create admin interfaces to:
- Add new products
- Edit existing products
- Manage categories
- Upload images
- Set pricing

## Best Practices

### 1. Product Naming
- Use clear, descriptive names
- Avoid overly technical jargon
- Keep names under 25 characters for better display

### 2. Descriptions
- Write compelling, concise descriptions
- Highlight key features and benefits
- Keep under 100 characters for best display

### 3. Pricing
- Use consistent pricing tiers
- Consider psychological pricing (e.g., $99 vs $100)
- Research competitor pricing

### 4. Categories
- Be consistent with categorization
- Consider adding subcategories for large catalogs
- Keep the number of main categories manageable

### 5. Images/Gradients
- Choose colors that represent the product type
- Maintain visual consistency across similar products
- Consider adding real product images in the future

### 6. Featured Products
- Limit featured products to avoid overwhelming users
- Rotate featured products regularly
- Feature your best-selling or newest products

### 7. Coming Soon Products
- Use sparingly to maintain credibility
- Set realistic timelines
- Remove or update regularly

## Troubleshooting

### Common Issues:

1. **Product not showing**: Check category spelling and ensure it's 'instruments' or 'effects'
2. **Wrong gradient**: Verify gradient name matches available classes
3. **Search not working**: Ensure name, description, and type fields are properly filled
4. **Sorting issues**: Check that featured and price values are correct data types

### Testing Checklist:
- [ ] Product appears in correct category
- [ ] Search functionality works
- [ ] Sorting works correctly
- [ ] Price displays properly
- [ ] Mobile responsive
- [ ] Gradient displays correctly
- [ ] Coming soon badge shows when appropriate

## Need Help?

If you encounter issues while adding products:
1. Check the browser console for JavaScript errors
2. Verify all required fields are filled
3. Ensure unique IDs for each product
4. Test on different screen sizes
5. Validate that category names match exactly

Remember to backup your data before making significant changes, and consider implementing a staging environment for testing new products before they go live.
