import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const shouldExitOnFailure = process.env.NODE_ENV === 'production' && process.env.ALLOW_START_WITHOUT_DB !== 'true';

  if (!uri) {
    console.error('❌ MongoDB Connection Error: MONGODB_URI is not set');
    if (shouldExitOnFailure) {
      process.exit(1);
    }
    console.warn('⚠️ Starting server without database connection. Set ALLOW_START_WITHOUT_DB=true for this behavior in production.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      // These options are no longer needed in Mongoose 6+, but kept for compatibility
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Retry connection when running locally / non-strict mode
    if (!shouldExitOnFailure) {
      console.log('⏳ Retrying connection in 5 seconds while server stays online...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

export default connectDB;
