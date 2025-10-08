module.exports = function initDatabase(connection) {
  // Create products table
  connection.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name VARCHAR,
      description TEXT,
      price DECIMAL(10, 2),
      category VARCHAR,
      image_url VARCHAR,
      stock_quantity INTEGER,
      lead_time_days INTEGER,
      rating DECIMAL(2, 1),
      review_count INTEGER
    )
  `);

  // Create sequence for reviews
  connection.run(`
    CREATE SEQUENCE IF NOT EXISTS reviews_seq START 1
  `);

  // Create reviews table
  connection.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY DEFAULT nextval('reviews_seq'),
      product_id INTEGER,
      rating INTEGER,
      title VARCHAR,
      comment TEXT,
      reviewer_name VARCHAR,
      created_at TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Create orders table
  connection.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      items TEXT,
      total DECIMAL(10, 2),
      shipping_address TEXT,
      status VARCHAR,
      created_at TIMESTAMP
    )
  `);

  // Generate realistic product data
  const products = [
    // Electronics
    { id: 1, name: 'Samsung 65" 4K Smart TV', description: 'Crystal clear 4K UHD resolution with HDR support. Smart TV features include built-in streaming apps and voice control. Sleek design fits any living room.', price: 799.99, category: 'Electronics', image_url: 'https://placehold.co/400x300/667eea/white?text=Samsung+TV', stock_quantity: 45, lead_time_days: 3, rating: 4.5, review_count: 342 },
    { id: 2, name: 'Apple iPhone 15 Pro', description: 'The latest iPhone with A17 Pro chip, advanced camera system, and titanium design. 256GB storage for all your photos and apps.', price: 1099.99, category: 'Electronics', image_url: 'https://placehold.co/400x300/667eea/white?text=iPhone+15', stock_quantity: 120, lead_time_days: 1, rating: 4.8, review_count: 1205 },
    { id: 3, name: 'Sony WH-1000XM5 Headphones', description: 'Industry-leading noise cancellation with exceptional sound quality. 30-hour battery life and comfortable design for all-day wear.', price: 349.99, category: 'Electronics', image_url: 'https://placehold.co/400x300/667eea/white?text=Sony+Headphones', stock_quantity: 85, lead_time_days: 2, rating: 4.7, review_count: 892 },
    { id: 4, name: 'Dell XPS 15 Laptop', description: 'Powerful laptop with Intel i7 processor, 16GB RAM, and 512GB SSD. Perfect for work and entertainment with stunning 15.6" display.', price: 1499.99, category: 'Electronics', image_url: 'https://placehold.co/400x300/667eea/white?text=Dell+XPS', stock_quantity: 32, lead_time_days: 5, rating: 4.6, review_count: 567 },
    { id: 5, name: 'Canon EOS R6 Camera', description: 'Professional mirrorless camera with 20MP full-frame sensor. 4K video recording and advanced autofocus system.', price: 2499.99, category: 'Electronics', image_url: 'https://placehold.co/400x300/667eea/white?text=Canon+Camera', stock_quantity: 18, lead_time_days: 7, rating: 4.9, review_count: 234 },
    { id: 6, name: 'iPad Air (5th Gen)', description: 'Powerful iPad with M1 chip and stunning 10.9" Liquid Retina display. Perfect for creativity and productivity.', price: 599.99, category: 'Electronics', image_url: 'https://placehold.co/400x300/667eea/white?text=iPad+Air', stock_quantity: 95, lead_time_days: 2, rating: 4.7, review_count: 678 },
    { id: 7, name: 'Samsung Galaxy Watch 6', description: 'Advanced smartwatch with health tracking, GPS, and long battery life. Stylish design with customizable watch faces.', price: 349.99, category: 'Electronics', image_url: 'https://placehold.co/400x300/667eea/white?text=Galaxy+Watch', stock_quantity: 67, lead_time_days: 3, rating: 4.4, review_count: 445 },
    { id: 8, name: 'Bose SoundLink Revolve', description: 'Portable Bluetooth speaker with 360-degree sound. Water-resistant design perfect for outdoor adventures.', price: 199.99, category: 'Electronics', image_url: 'https://placehold.co/400x300/667eea/white?text=Bose+Speaker', stock_quantity: 112, lead_time_days: 1, rating: 4.6, review_count: 823 },
    { id: 9, name: 'LG 27" 4K Monitor', description: 'Ultra HD 4K monitor with IPS panel and HDR10 support. Perfect for creative professionals and gamers.', price: 449.99, category: 'Electronics', image_url: 'https://placehold.co/400x300/667eea/white?text=LG+Monitor', stock_quantity: 54, lead_time_days: 4, rating: 4.5, review_count: 389 },
    { id: 10, name: 'Nintendo Switch OLED', description: 'Enhanced Switch with vibrant OLED screen and improved audio. Includes dock and Joy-Con controllers.', price: 349.99, category: 'Electronics', image_url: 'https://placehold.co/400x300/667eea/white?text=Switch+OLED', stock_quantity: 78, lead_time_days: 2, rating: 4.8, review_count: 1456 },

    // Home & Kitchen
    { id: 11, name: 'Instant Pot Duo 7-in-1', description: 'Multi-functional pressure cooker that replaces 7 kitchen appliances. Perfect for quick and easy meals.', price: 89.99, category: 'Home & Kitchen', image_url: 'https://placehold.co/400x300/667eea/white?text=Instant+Pot', stock_quantity: 145, lead_time_days: 2, rating: 4.7, review_count: 3456 },
    { id: 12, name: 'KitchenAid Stand Mixer', description: 'Professional-grade 5-quart stand mixer in classic design. Includes multiple attachments for versatile cooking.', price: 379.99, category: 'Home & Kitchen', image_url: 'https://placehold.co/400x300/667eea/white?text=KitchenAid', stock_quantity: 42, lead_time_days: 3, rating: 4.9, review_count: 2134 },
    { id: 13, name: 'Dyson V15 Vacuum', description: 'Cordless vacuum with laser detection and powerful suction. Up to 60 minutes of runtime.', price: 649.99, category: 'Home & Kitchen', image_url: 'https://placehold.co/400x300/667eea/white?text=Dyson+Vacuum', stock_quantity: 38, lead_time_days: 5, rating: 4.6, review_count: 892 },
    { id: 14, name: 'Ninja Air Fryer', description: '5.5-quart air fryer with dehydrate function. Cook healthier meals with up to 75% less fat.', price: 119.99, category: 'Home & Kitchen', image_url: 'https://placehold.co/400x300/667eea/white?text=Air+Fryer', stock_quantity: 89, lead_time_days: 2, rating: 4.5, review_count: 1678 },
    { id: 15, name: 'Keurig K-Elite Coffee Maker', description: 'Single-serve coffee maker with strong brew and iced coffee settings. Large 75oz water reservoir.', price: 169.99, category: 'Home & Kitchen', image_url: 'https://placehold.co/400x300/667eea/white?text=Keurig', stock_quantity: 103, lead_time_days: 2, rating: 4.4, review_count: 2341 },
    { id: 16, name: 'Lodge Cast Iron Skillet', description: '12-inch pre-seasoned cast iron skillet. Perfect for stovetop to oven cooking.', price: 34.99, category: 'Home & Kitchen', image_url: 'https://placehold.co/400x300/667eea/white?text=Cast+Iron', stock_quantity: 234, lead_time_days: 1, rating: 4.8, review_count: 5678 },
    { id: 17, name: 'Cuisinart Food Processor', description: '14-cup food processor with multiple blades and discs. Makes meal prep effortless.', price: 199.99, category: 'Home & Kitchen', image_url: 'https://placehold.co/400x300/667eea/white?text=Food+Processor', stock_quantity: 56, lead_time_days: 3, rating: 4.6, review_count: 1234 },
    { id: 18, name: 'iRobot Roomba j7+', description: 'Self-emptying robot vacuum with smart mapping and obstacle avoidance. Works with Alexa.', price: 799.99, category: 'Home & Kitchen', image_url: 'https://placehold.co/400x300/667eea/white?text=Roomba', stock_quantity: 29, lead_time_days: 4, rating: 4.5, review_count: 876 },
    { id: 19, name: 'Breville Espresso Machine', description: 'Professional espresso machine with built-in grinder. Create café-quality drinks at home.', price: 699.99, category: 'Home & Kitchen', image_url: 'https://placehold.co/400x300/667eea/white?text=Espresso', stock_quantity: 24, lead_time_days: 6, rating: 4.7, review_count: 567 },
    { id: 20, name: 'OXO Good Grips Knife Set', description: '15-piece knife block set with high-carbon stainless steel blades. Comfortable non-slip handles.', price: 149.99, category: 'Home & Kitchen', image_url: 'https://placehold.co/400x300/667eea/white?text=Knife+Set', stock_quantity: 78, lead_time_days: 2, rating: 4.6, review_count: 923 },

    // Books
    { id: 21, name: 'Atomic Habits by James Clear', description: 'Transform your life with tiny changes that deliver remarkable results. #1 New York Times bestseller.', price: 16.99, category: 'Books', image_url: 'https://placehold.co/400x300/667eea/white?text=Atomic+Habits', stock_quantity: 456, lead_time_days: 1, rating: 4.8, review_count: 8934 },
    { id: 22, name: 'The Midnight Library', description: 'A dazzling novel about all the choices that go into a life well lived, from the author of How to Stop Time.', price: 14.99, category: 'Books', image_url: 'https://placehold.co/400x300/667eea/white?text=Midnight+Library', stock_quantity: 289, lead_time_days: 1, rating: 4.7, review_count: 5678 },
    { id: 23, name: 'Educated by Tara Westover', description: 'A memoir about a young woman who, kept out of school, leaves her survivalist family and goes on to earn a PhD.', price: 15.99, category: 'Books', image_url: 'https://placehold.co/400x300/667eea/white?text=Educated', stock_quantity: 334, lead_time_days: 1, rating: 4.9, review_count: 12456 },
    { id: 24, name: 'Thinking, Fast and Slow', description: 'Daniel Kahneman reveals where we can trust our intuitions and how we can tap into the benefits of slow thinking.', price: 18.99, category: 'Books', image_url: 'https://placehold.co/400x300/667eea/white?text=Thinking', stock_quantity: 198, lead_time_days: 2, rating: 4.6, review_count: 4567 },
    { id: 25, name: 'The Body Keeps the Score', description: 'A pioneering book that examines how trauma reshapes the body and brain.', price: 19.99, category: 'Books', image_url: 'https://placehold.co/400x300/667eea/white?text=The+Body', stock_quantity: 267, lead_time_days: 1, rating: 4.8, review_count: 6789 },

    // Clothing
    { id: 26, name: 'Levi\'s 501 Original Jeans', description: 'Classic straight fit jeans in authentic denim. The original blue jean since 1873.', price: 69.99, category: 'Clothing', image_url: 'https://placehold.co/400x300/667eea/white?text=Levis+501', stock_quantity: 345, lead_time_days: 2, rating: 4.5, review_count: 3456 },
    { id: 27, name: 'Nike Air Max 270', description: 'Men\'s running shoes with Max Air unit for ultimate comfort. Breathable mesh upper.', price: 149.99, category: 'Clothing', image_url: 'https://placehold.co/400x300/667eea/white?text=Air+Max', stock_quantity: 234, lead_time_days: 3, rating: 4.7, review_count: 2345 },
    { id: 28, name: 'Patagonia Down Jacket', description: 'Warm and packable down jacket with recycled materials. Perfect for outdoor adventures.', price: 249.99, category: 'Clothing', image_url: 'https://placehold.co/400x300/667eea/white?text=Patagonia', stock_quantity: 67, lead_time_days: 4, rating: 4.8, review_count: 1234 },
    { id: 29, name: 'Hanes ComfortSoft T-Shirts', description: 'Pack of 6 classic crew neck t-shirts in 100% cotton. Tagless for comfort.', price: 24.99, category: 'Clothing', image_url: 'https://placehold.co/400x300/667eea/white?text=Hanes+Tees', stock_quantity: 567, lead_time_days: 1, rating: 4.4, review_count: 4567 },
    { id: 30, name: 'Adidas Track Pants', description: 'Classic 3-stripe track pants with comfortable elastic waist. Perfect for casual wear.', price: 49.99, category: 'Clothing', image_url: 'https://placehold.co/400x300/667eea/white?text=Adidas', stock_quantity: 289, lead_time_days: 2, rating: 4.6, review_count: 1890 },

    // Sports & Outdoors
    { id: 31, name: 'Yeti Rambler 30oz Tumbler', description: 'Insulated stainless steel tumbler keeps drinks cold for 24 hours. Dishwasher safe.', price: 39.99, category: 'Sports & Outdoors', image_url: 'https://placehold.co/400x300/667eea/white?text=Yeti+Tumbler', stock_quantity: 456, lead_time_days: 2, rating: 4.8, review_count: 3456 },
    { id: 32, name: 'Coleman 4-Person Tent', description: 'Easy setup dome tent with WeatherTec system. Perfect for camping trips.', price: 89.99, category: 'Sports & Outdoors', image_url: 'https://placehold.co/400x300/667eea/white?text=Coleman+Tent', stock_quantity: 78, lead_time_days: 3, rating: 4.5, review_count: 2345 },
    { id: 33, name: 'Schwinn Mountain Bike', description: '21-speed mountain bike with front suspension and dual disc brakes. 29-inch wheels.', price: 449.99, category: 'Sports & Outdoors', image_url: 'https://placehold.co/400x300/667eea/white?text=Schwinn+Bike', stock_quantity: 34, lead_time_days: 7, rating: 4.4, review_count: 1234 },
    { id: 34, name: 'Spalding Basketball', description: 'Official size composite leather basketball. Indoor/outdoor use.', price: 29.99, category: 'Sports & Outdoors', image_url: 'https://placehold.co/400x300/667eea/white?text=Basketball', stock_quantity: 234, lead_time_days: 1, rating: 4.6, review_count: 1890 },
    { id: 35, name: 'Fitbit Charge 5', description: 'Advanced fitness tracker with built-in GPS and health metrics. Up to 7 days battery life.', price: 149.99, category: 'Sports & Outdoors', image_url: 'https://placehold.co/400x300/667eea/white?text=Fitbit', stock_quantity: 145, lead_time_days: 2, rating: 4.5, review_count: 2678 },

    // Toys & Games
    { id: 36, name: 'LEGO Star Wars Millennium Falcon', description: 'Iconic building set with 7,500+ pieces. Includes minifigures of Han Solo, Chewbacca, and more.', price: 849.99, category: 'Toys & Games', image_url: 'https://placehold.co/400x300/667eea/white?text=LEGO', stock_quantity: 23, lead_time_days: 5, rating: 4.9, review_count: 1456 },
    { id: 37, name: 'Monopoly Classic Board Game', description: 'The classic property trading game for 2-6 players. Ages 8 and up.', price: 19.99, category: 'Toys & Games', image_url: 'https://placehold.co/400x300/667eea/white?text=Monopoly', stock_quantity: 289, lead_time_days: 1, rating: 4.7, review_count: 5678 },
    { id: 38, name: 'Nerf Elite 2.0 Blaster', description: 'Motorized blaster with 10-dart clip. Fires darts up to 90 feet.', price: 39.99, category: 'Toys & Games', image_url: 'https://placehold.co/400x300/667eea/white?text=Nerf', stock_quantity: 167, lead_time_days: 2, rating: 4.5, review_count: 2345 },
    { id: 39, name: 'Barbie Dreamhouse', description: '3-story dollhouse with 8 rooms and 70+ accessories. Lights and sounds included.', price: 199.99, category: 'Toys & Games', image_url: 'https://placehold.co/400x300/667eea/white?text=Barbie', stock_quantity: 45, lead_time_days: 4, rating: 4.6, review_count: 1890 },
    { id: 40, name: 'PlayStation 5', description: 'Next-gen gaming console with ultra-high speed SSD and stunning graphics. Includes DualSense controller.', price: 499.99, category: 'Toys & Games', image_url: 'https://placehold.co/400x300/667eea/white?text=PS5', stock_quantity: 12, lead_time_days: 10, rating: 4.9, review_count: 8934 },

    // Beauty & Personal Care
    { id: 41, name: 'Oral-B Electric Toothbrush', description: 'Rechargeable toothbrush with pressure sensor and multiple cleaning modes. Includes travel case.', price: 79.99, category: 'Beauty & Personal Care', image_url: 'https://placehold.co/400x300/667eea/white?text=Oral-B', stock_quantity: 234, lead_time_days: 2, rating: 4.6, review_count: 3456 },
    { id: 42, name: 'Neutrogena Hydro Boost', description: 'Hydrating gel-cream with hyaluronic acid. Oil-free and non-comedogenic.', price: 18.99, category: 'Beauty & Personal Care', image_url: 'https://placehold.co/400x300/667eea/white?text=Neutrogena', stock_quantity: 456, lead_time_days: 1, rating: 4.5, review_count: 4567 },
    { id: 43, name: 'Gillette Fusion5 Razors', description: '8-pack of men\'s razor blades with 5-blade technology and precision trimmer.', price: 34.99, category: 'Beauty & Personal Care', image_url: 'https://placehold.co/400x300/667eea/white?text=Gillette', stock_quantity: 345, lead_time_days: 1, rating: 4.7, review_count: 2345 },
    { id: 44, name: 'Revlon Hair Dryer Brush', description: 'One-step hair dryer and volumizer with ionic technology. Reduces frizz and static.', price: 59.99, category: 'Beauty & Personal Care', image_url: 'https://placehold.co/400x300/667eea/white?text=Revlon', stock_quantity: 123, lead_time_days: 3, rating: 4.4, review_count: 6789 },
    { id: 45, name: 'CeraVe Moisturizing Cream', description: 'Daily face and body moisturizer with hyaluronic acid and ceramides. Developed with dermatologists.', price: 16.99, category: 'Beauty & Personal Care', image_url: 'https://placehold.co/400x300/667eea/white?text=CeraVe', stock_quantity: 567, lead_time_days: 1, rating: 4.8, review_count: 8934 },

    // Automotive
    { id: 46, name: 'Rain-X Windshield Treatment', description: 'Water repellent treatment for improved visibility in rain. Lasts for months.', price: 9.99, category: 'Automotive', image_url: 'https://placehold.co/400x300/667eea/white?text=Rain-X', stock_quantity: 678, lead_time_days: 1, rating: 4.6, review_count: 2345 },
    { id: 47, name: 'Armor All Car Cleaning Kit', description: 'Complete car care kit with interior cleaner, tire shine, and microfiber towels.', price: 24.99, category: 'Automotive', image_url: 'https://placehold.co/400x300/667eea/white?text=Armor+All', stock_quantity: 234, lead_time_days: 2, rating: 4.5, review_count: 1234 },
    { id: 48, name: 'Garmin Dash Cam', description: '1080p dash camera with GPS and driver alerts. Automatic incident detection.', price: 149.99, category: 'Automotive', image_url: 'https://placehold.co/400x300/667eea/white?text=Garmin', stock_quantity: 67, lead_time_days: 4, rating: 4.7, review_count: 1890 },
    { id: 49, name: 'Michelin Windshield Wipers', description: 'Premium beam wiper blades with Smart Flex design. Set of 2.', price: 29.99, category: 'Automotive', image_url: 'https://placehold.co/400x300/667eea/white?text=Michelin', stock_quantity: 345, lead_time_days: 2, rating: 4.6, review_count: 2678 },
    { id: 50, name: 'Black+Decker Car Vacuum', description: 'Cordless handheld vacuum with cyclonic action. Perfect for quick car cleanups.', price: 49.99, category: 'Automotive', image_url: 'https://placehold.co/400x300/667eea/white?text=Vacuum', stock_quantity: 156, lead_time_days: 3, rating: 4.4, review_count: 1456 },

    // Garden & Outdoor
    { id: 51, name: 'Char-Broil Gas Grill', description: '4-burner stainless steel gas grill with 36,000 BTU. Includes side burner.', price: 399.99, category: 'Garden & Outdoor', image_url: 'https://placehold.co/400x300/667eea/white?text=Gas+Grill', stock_quantity: 34, lead_time_days: 7, rating: 4.5, review_count: 1234 },
    { id: 52, name: 'Scotts Turf Builder Lawn Food', description: '12.5lb bag covers 5,000 sq ft. Makes grass thick and green.', price: 39.99, category: 'Garden & Outdoor', image_url: 'https://placehold.co/400x300/667eea/white?text=Lawn+Food', stock_quantity: 234, lead_time_days: 2, rating: 4.6, review_count: 3456 },
    { id: 53, name: 'Keter Garden Storage Bench', description: 'Waterproof 60-gallon storage with comfortable seating. Perfect for patio.', price: 129.99, category: 'Garden & Outdoor', image_url: 'https://placehold.co/400x300/667eea/white?text=Storage+Bench', stock_quantity: 78, lead_time_days: 5, rating: 4.7, review_count: 892 },
    { id: 54, name: 'Fiskars Bypass Pruning Shears', description: 'Professional-grade pruners with hardened steel blade. Lifetime warranty.', price: 24.99, category: 'Garden & Outdoor', image_url: 'https://placehold.co/400x300/667eea/white?text=Pruners', stock_quantity: 345, lead_time_days: 1, rating: 4.8, review_count: 2345 },
    { id: 55, name: 'Hampton Bay Patio Set', description: '5-piece conversation set with cushions. Weather-resistant wicker construction.', price: 599.99, category: 'Garden & Outdoor', image_url: 'https://placehold.co/400x300/667eea/white?text=Patio+Set', stock_quantity: 23, lead_time_days: 10, rating: 4.4, review_count: 567 },

    // Pet Supplies
    { id: 56, name: 'KONG Classic Dog Toy', description: 'Durable rubber toy for medium dogs. Can be stuffed with treats.', price: 12.99, category: 'Pet Supplies', image_url: 'https://placehold.co/400x300/667eea/white?text=KONG', stock_quantity: 456, lead_time_days: 1, rating: 4.7, review_count: 5678 },
    { id: 57, name: 'Purina Pro Plan Dog Food', description: '35lb bag of chicken and rice formula. High protein for active dogs.', price: 54.99, category: 'Pet Supplies', image_url: 'https://placehold.co/400x300/667eea/white?text=Dog+Food', stock_quantity: 234, lead_time_days: 2, rating: 4.6, review_count: 3456 },
    { id: 58, name: 'FURminator Deshedding Tool', description: 'Reduces shedding by up to 90%. For large dogs with long hair.', price: 39.99, category: 'Pet Supplies', image_url: 'https://placehold.co/400x300/667eea/white?text=FURminator', stock_quantity: 167, lead_time_days: 2, rating: 4.8, review_count: 4567 },
    { id: 59, name: 'PetSafe Automatic Feeder', description: 'Programmable feeder dispenses food on schedule. Holds up to 24 cups.', price: 89.99, category: 'Pet Supplies', image_url: 'https://placehold.co/400x300/667eea/white?text=Auto+Feeder', stock_quantity: 78, lead_time_days: 3, rating: 4.5, review_count: 1890 },
    { id: 60, name: 'Fresh Step Cat Litter', description: '25lb clumping litter with Febreze freshness. Low dust formula.', price: 19.99, category: 'Pet Supplies', image_url: 'https://placehold.co/400x300/667eea/white?text=Cat+Litter', stock_quantity: 345, lead_time_days: 2, rating: 4.4, review_count: 2678 }
  ];

  // Insert products
  const productStmt = connection.prepare(`
    INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  products.forEach(product => {
    productStmt.run(
      product.id,
      product.name,
      product.description,
      product.price,
      product.category,
      product.image_url,
      product.stock_quantity,
      product.lead_time_days,
      product.rating,
      product.review_count
    );
  });

  productStmt.finalize();

  // Generate sample reviews
  const sampleReviews = [
    // Samsung TV Reviews
    { product_id: 1, rating: 5, title: 'Amazing picture quality!', comment: 'The 4K resolution is stunning and the smart features work flawlessly. Best purchase of the year!', reviewer_name: 'John D.' },
    { product_id: 1, rating: 4, title: 'Great TV, minor issues', comment: 'Love the display but the remote could be better. Still highly recommend.', reviewer_name: 'Sarah M.' },
    { product_id: 1, rating: 5, title: 'Perfect for gaming', comment: 'Low input lag and vivid colors. My PS5 looks incredible on this.', reviewer_name: 'Marcus T.' },
    { product_id: 1, rating: 3, title: 'Good but pricey', comment: 'Great TV but seems overpriced compared to competitors. Quality is solid though.', reviewer_name: 'Jennifer L.' },

    // iPhone 15 Pro Reviews
    { product_id: 2, rating: 5, title: 'Best iPhone yet', comment: 'The camera is incredible and the titanium design feels premium. USB-C is a game changer!', reviewer_name: 'Mike R.' },
    { product_id: 2, rating: 5, title: 'Worth every penny', comment: 'Upgraded from iPhone 12 and the difference is huge. Battery life is amazing.', reviewer_name: 'Emily S.' },
    { product_id: 2, rating: 4, title: 'Great phone, heavy price', comment: 'Love everything about it but the price is steep. Camera quality is unmatched.', reviewer_name: 'Robert K.' },
    { product_id: 2, rating: 5, title: 'Professional quality photos', comment: 'As a photographer, this phone replaces my point-and-shoot. ProRAW is incredible.', reviewer_name: 'Linda Chen' },

    // Sony Headphones Reviews
    { product_id: 3, rating: 5, title: 'Noise cancellation is perfect', comment: 'I can finally focus on work without distractions. Sound quality is exceptional.', reviewer_name: 'David L.' },
    { product_id: 3, rating: 5, title: 'Best for travel', comment: 'Used these on a 14-hour flight. Complete silence. Battery lasted the whole trip.', reviewer_name: 'Patricia W.' },
    { product_id: 3, rating: 4, title: 'Almost perfect', comment: 'Amazing sound but a bit pricey. Comfort could be better for long sessions.', reviewer_name: 'James H.' },

    // Dell XPS Laptop Reviews
    { product_id: 4, rating: 5, title: 'Perfect work machine', comment: 'Handles all my development tasks effortlessly. Display is gorgeous.', reviewer_name: 'Kevin P.' },
    { product_id: 4, rating: 4, title: 'Great laptop', comment: 'Fast and reliable. Wish it had better port selection though.', reviewer_name: 'Rachel B.' },
    { product_id: 4, rating: 5, title: 'Premium build quality', comment: 'Feels solid and well-made. Best laptop I have owned.', reviewer_name: 'Steven M.' },

    // Canon Camera Reviews
    { product_id: 5, rating: 5, title: 'Pro-level results', comment: 'This camera takes my photography to the next level. Auto-focus is lightning fast.', reviewer_name: 'Michelle K.' },
    { product_id: 5, rating: 5, title: 'Love it!', comment: 'Perfect for wildlife photography. Continuous shooting mode is amazing.', reviewer_name: 'Daniel R.' },
    { product_id: 5, rating: 4, title: 'Excellent camera', comment: 'Great for enthusiasts. Steep learning curve but worth it.', reviewer_name: 'Nancy G.' },

    // Roomba Reviews
    { product_id: 11, rating: 5, title: 'Life changing!', comment: 'Makes dinner prep so much easier. Love this thing! Saves me hours every week.', reviewer_name: 'Lisa K.' },
    { product_id: 11, rating: 4, title: 'Great product', comment: 'Does everything it promises. Slight learning curve but works great.', reviewer_name: 'Tom H.' },
    { product_id: 11, rating: 5, title: 'Best purchase ever', comment: 'My floors have never been cleaner. Works great on carpet and hardwood.', reviewer_name: 'Amanda J.' },
    { product_id: 11, rating: 3, title: 'Good but loud', comment: 'Cleans well but is quite noisy. Hard to run while working from home.', reviewer_name: 'Brian S.' },

    // Keurig Coffee Maker Reviews
    { product_id: 12, rating: 5, title: 'Morning essential', comment: 'Quick, convenient, and makes great coffee. Perfect for busy mornings.', reviewer_name: 'Carol D.' },
    { product_id: 12, rating: 4, title: 'Convenient', comment: 'Love the variety of pods available. Wish it was quieter.', reviewer_name: 'Paul F.' },

    // Book Reviews
    { product_id: 21, rating: 5, title: 'Must read!', comment: 'This book actually helped me build better habits. Practical and insightful.', reviewer_name: 'Amanda P.' },
    { product_id: 21, rating: 5, title: 'Changed my life', comment: 'Implementing these strategies has transformed my daily routine.', reviewer_name: 'Gregory T.' },
    { product_id: 21, rating: 4, title: 'Good read', comment: 'Helpful tips but some parts felt repetitive. Still worth reading.', reviewer_name: 'Helen M.' },

    // Levi's Jeans Reviews
    { product_id: 31, rating: 5, title: 'Perfect fit', comment: 'These jeans fit perfectly and are very comfortable. True to size.', reviewer_name: 'Mark W.' },
    { product_id: 31, rating: 4, title: 'Classic style', comment: 'Good quality denim. Wash before wearing to prevent color bleeding.', reviewer_name: 'Jessica R.' },
    { product_id: 31, rating: 5, title: 'Best jeans ever', comment: 'I have bought 3 pairs. Durable and stylish.', reviewer_name: 'Ryan C.' },

    // North Face Jacket Reviews
    { product_id: 32, rating: 5, title: 'Warm and durable', comment: 'Keeps me warm in -10°F weather. Worth every penny.', reviewer_name: 'Karen S.' },
    { product_id: 32, rating: 5, title: 'Great winter jacket', comment: 'Perfect for hiking and everyday wear. Water-resistant works great.', reviewer_name: 'Todd L.' },

    // LEGO Reviews
    { product_id: 36, rating: 5, title: 'Epic build', comment: 'Took me 3 weekends but totally worth it. Looks amazing on display!', reviewer_name: 'Chris B.' },
    { product_id: 36, rating: 5, title: 'Challenging and fun', comment: 'Great for adults. Very detailed and well-designed.', reviewer_name: 'Nicole H.' },
    { product_id: 36, rating: 4, title: 'Awesome set', comment: 'Incredibly detailed. Price is high but quality matches.', reviewer_name: 'Andrew M.' },

    // PS5 Reviews
    { product_id: 40, rating: 5, title: 'Next-gen gaming', comment: 'The graphics and loading times are incredible. SSD is a game changer.', reviewer_name: 'Alex W.' },
    { product_id: 40, rating: 5, title: 'Worth the wait', comment: 'Finally got one! Games look stunning and the controller is amazing.', reviewer_name: 'Jordan P.' },
    { product_id: 40, rating: 4, title: 'Great console', comment: 'Love it but wish there were more exclusive games at launch.', reviewer_name: 'Tyler S.' },

    // Dyson Vacuum Reviews
    { product_id: 46, rating: 5, title: 'Best vacuum ever', comment: 'Powerful suction and versatile. Worth the investment.', reviewer_name: 'Diana F.' },
    { product_id: 46, rating: 5, title: 'Amazing performance', comment: 'Picks up everything. Battery lasts long enough for my whole house.', reviewer_name: 'Edward N.' },
    { product_id: 46, rating: 4, title: 'Expensive but good', comment: 'Great quality but the price is steep. Does the job well.', reviewer_name: 'Fiona G.' },

    // Pet Supplies Reviews
    { product_id: 56, rating: 5, title: 'Dog loves it', comment: 'Indestructible toy. My Lab has been chewing on it for months.', reviewer_name: 'Barbara H.' },
    { product_id: 56, rating: 5, title: 'Highly recommend', comment: 'Perfect size for medium dogs. Keeps them entertained for hours.', reviewer_name: 'Charles K.' },
    { product_id: 57, rating: 4, title: 'Good quality food', comment: 'My dog is healthier since switching. Coat is shinier.', reviewer_name: 'Dorothy J.' },
    { product_id: 57, rating: 5, title: 'Dog loves it', comment: 'Finally found a food my picky eater will eat. Great ingredients.', reviewer_name: 'Frank L.' }
  ];

  sampleReviews.forEach(review => {
    const query = `INSERT INTO reviews (product_id, rating, title, comment, reviewer_name, created_at)
                   VALUES (${review.product_id}, ${review.rating}, '${review.title.replace(/'/g, "''")}', '${review.comment.replace(/'/g, "''")}', '${review.reviewer_name.replace(/'/g, "''")}', CURRENT_TIMESTAMP)`;
    connection.run(query);
  });

  console.log('Database initialized with 60 products and sample reviews!');
};
