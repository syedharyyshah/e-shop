const Product = require('../models/Product');

const sampleProducts = [
  {
    productName: 'Premium Basmati Rice 5kg',
    companyName: 'Fauji Foods',
    category: 'Groceries',
    price: 1850,
    currency: 'PKR',
    stockQuantity: 150,
    piecesPerUnit: 1,
    unit: 'bag',
    description: 'Extra long grain premium basmati rice, perfect for biryani and pulao',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
  },
  {
    productName: 'Nestle Milkpak 1 Liter',
    companyName: 'Nestle Pakistan',
    category: 'Dairy',
    price: 180,
    currency: 'PKR',
    stockQuantity: 500,
    piecesPerUnit: 1,
    unit: 'carton',
    description: 'Full cream milk, rich in calcium and vitamins',
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'
  },
  {
    productName: 'Tapal Danedar 950g',
    companyName: 'Tapal Tea',
    category: 'Beverages',
    price: 850,
    currency: 'PKR',
    stockQuantity: 75,
    piecesPerUnit: 1,
    unit: 'box',
    description: 'Premium black tea with rich aroma and flavor',
    imageUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400'
  },
  {
    productName: 'Shan Biryani Masala 50g',
    companyName: 'Shan Foods',
    category: 'Spices',
    price: 65,
    currency: 'PKR',
    stockQuantity: 0,
    piecesPerUnit: 1,
    unit: 'packet',
    description: 'Authentic biryani masala with perfect blend of spices',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400'
  },
  {
    productName: 'Olper Milk 1.5 Liter',
    companyName: 'Engro Foods',
    category: 'Dairy',
    price: 210,
    currency: 'PKR',
    stockQuantity: 12,
    piecesPerUnit: 1,
    unit: 'carton',
    description: 'UHT treated milk with essential nutrients',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'
  },
  {
    productName: 'Kissan Jam Mixed Fruit 800g',
    companyName: 'Unilever Pakistan',
    category: 'Spreads',
    price: 450,
    currency: 'PKR',
    stockQuantity: 45,
    piecesPerUnit: 1,
    unit: 'jar',
    description: 'Mixed fruit jam made with real fruits',
    imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400'
  },
  {
    productName: 'Rooh Afza 800ml',
    companyName: 'Hamdard Pakistan',
    category: 'Beverages',
    price: 320,
    currency: 'PKR',
    stockQuantity: 200,
    piecesPerUnit: 1,
    unit: 'bottle',
    description: 'Refreshing rose syrup concentrate',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'
  },
  {
    productName: 'National Salt 800g',
    companyName: 'National Foods',
    category: 'Spices',
    price: 55,
    currency: 'PKR',
    stockQuantity: 8,
    piecesPerUnit: 1,
    unit: 'packet',
    description: 'Iodized refined table salt',
    imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400'
  },
  {
    productName: 'Dalda Cooking Oil 5 Liter',
    companyName: 'Dalda Foods',
    category: 'Cooking Oil',
    price: 2450,
    currency: 'PKR',
    stockQuantity: 35,
    piecesPerUnit: 1,
    unit: 'can',
    description: 'Fortified vegetable cooking oil',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'
  },
  {
    productName: 'Peak Freans Chocolate Chip Cookies',
    companyName: 'EBM Pakistan',
    category: 'Snacks',
    price: 120,
    currency: 'PKR',
    stockQuantity: 0,
    piecesPerUnit: 12,
    unit: 'pack',
    description: 'Crunchy cookies with chocolate chips',
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400'
  },
  {
    productName: 'Mehran Red Chili Powder 100g',
    companyName: 'Mehran Foods',
    category: 'Spices',
    price: 95,
    currency: 'PKR',
    stockQuantity: 120,
    piecesPerUnit: 1,
    unit: 'packet',
    description: 'Premium quality red chili powder',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400'
  },
  {
    productName: 'Sufi Banaspati Ghee 1kg',
    companyName: 'Sufi Group',
    category: 'Cooking Oil',
    price: 580,
    currency: 'PKR',
    stockQuantity: 60,
    piecesPerUnit: 1,
    unit: 'tin',
    description: 'Pure banaspati ghee for traditional cooking',
    imageUrl: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400'
  }
];

const seedProducts = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Seeded ${products.length} products`);

    return products;
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
};

module.exports = seedProducts;
