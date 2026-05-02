const mongoose = require('mongoose');
require('dotenv').config();

const InvoiceLoan = require('./models/InvoiceLoan');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop');
    console.log('Connected to MongoDB');

    // Find all loans where orderId is not an array
    const loans = await InvoiceLoan.find({
      $or: [
        { orderId: { $type: 'objectId' } },
        { orderId: { $not: { $type: 'array' } } }
      ]
    });

    console.log(`Found ${loans.length} loans with non-array orderId`);

    for (const loan of loans) {
      console.log(`Converting loan ${loan._id}, orderId: ${loan.orderId}`);
      
      // Convert to array
      await InvoiceLoan.updateOne(
        { _id: loan._id },
        { $set: { orderId: [loan.orderId] } }
      );
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
