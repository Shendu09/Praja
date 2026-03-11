// Seed Demo Service Locations
// Run: node backend/seedServices.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Import model after config
import ServiceLocation from './models/ServiceLocation.model.js';

const demoServices = [
  // Public Toilets
  {
    serviceId: 'SVC-TOILET-001',
    category: 'Public Toilet',
    name: 'Gandhi Park Public Toilet',
    address: 'Gandhi Park, MG Road',
    ward: 'Ward 12',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4673, lng: 78.8242 }
  },
  {
    serviceId: 'SVC-TOILET-002',
    category: 'Public Toilet',
    name: 'Bus Stand Public Toilet',
    address: 'APSRTC Bus Stand',
    ward: 'Ward 5',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4724, lng: 78.8169 }
  },
  {
    serviceId: 'SVC-TOILET-003',
    category: 'Public Toilet',
    name: 'Market Complex Toilet',
    address: 'Main Market, Near Clock Tower',
    ward: 'Ward 7',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4690, lng: 78.8220 }
  },
  
  // Parks
  {
    serviceId: 'SVC-PARK-001',
    category: 'Park & Garden',
    name: 'Rajiv Gandhi Park',
    address: 'College Road, Kadapa',
    ward: 'Ward 8',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4698, lng: 78.8201 }
  },
  {
    serviceId: 'SVC-PARK-002',
    category: 'Park & Garden',
    name: 'Municipal Garden',
    address: 'Trunk Road, Near Bus Stand',
    ward: 'Ward 4',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4710, lng: 78.8180 }
  },
  
  // Hospitals
  {
    serviceId: 'SVC-HOSP-001',
    category: 'Govt Hospital',
    name: 'Rajiv Gandhi Institute of Medical Sciences',
    address: 'RIMS Road, Kadapa',
    ward: 'Ward 3',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4652, lng: 78.8187 }
  },
  {
    serviceId: 'SVC-HOSP-002',
    category: 'Govt Hospital',
    name: 'District Government Hospital',
    address: 'Hospital Road, Kadapa',
    ward: 'Ward 6',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4665, lng: 78.8195 }
  },
  
  // Transport
  {
    serviceId: 'SVC-TRANS-001',
    category: 'Public Transport',
    name: 'Kadapa Central Bus Stand',
    address: 'Bus Stand Road, Kadapa',
    ward: 'Ward 5',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4724, lng: 78.8169 }
  },
  {
    serviceId: 'SVC-TRANS-002',
    category: 'Public Transport',
    name: 'Railway Station Auto Stand',
    address: 'Kadapa Railway Station',
    ward: 'Ward 9',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4780, lng: 78.8150 }
  },
  
  // Government Offices
  {
    serviceId: 'SVC-OFFICE-001',
    category: 'Govt Office',
    name: 'YSR District Collectorate',
    address: 'Collectorate Road, Kadapa',
    ward: 'Ward 1',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4641, lng: 78.8226 }
  },
  {
    serviceId: 'SVC-OFFICE-002',
    category: 'Govt Office',
    name: 'Municipal Corporation Office',
    address: 'MG Road, Kadapa',
    ward: 'Ward 2',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4655, lng: 78.8235 }
  },
  
  // Water Supply
  {
    serviceId: 'SVC-WATER-001',
    category: 'Water Supply',
    name: 'Public Water Tank - Ward 10',
    address: 'Community Hall, Ward 10',
    ward: 'Ward 10',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4700, lng: 78.8250 }
  },
  {
    serviceId: 'SVC-WATER-002',
    category: 'Water Supply',
    name: 'Borewell Station - Ward 15',
    address: 'Near High School, Ward 15',
    ward: 'Ward 15',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4720, lng: 78.8280 }
  },
  
  // Waste Collection
  {
    serviceId: 'SVC-WASTE-001',
    category: 'Waste Collection',
    name: 'Waste Collection Point - Market',
    address: 'Main Market Back Gate',
    ward: 'Ward 7',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4692, lng: 78.8225 }
  },
  
  // Street Lights
  {
    serviceId: 'SVC-LIGHT-001',
    category: 'Street Light',
    name: 'Street Lights - MG Road Stretch',
    address: 'MG Road, from Clock Tower to Bus Stand',
    ward: 'Ward 5',
    city: 'Kadapa',
    state: 'Andhra Pradesh',
    coordinates: { lat: 14.4715, lng: 78.8200 }
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/praja';
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing services
    await ServiceLocation.deleteMany({});
    console.log('🗑️  Cleared existing services');
    
    // Insert demo services
    const result = await ServiceLocation.insertMany(demoServices);
    console.log(`✅ Inserted ${result.length} demo services!`);
    
    // Display inserted services
    console.log('\n📋 Demo Services Created:');
    console.log('─'.repeat(60));
    
    const categories = [...new Set(demoServices.map(s => s.category))];
    for (const cat of categories) {
      const services = demoServices.filter(s => s.category === cat);
      console.log(`\n${cat}:`);
      services.forEach(s => {
        console.log(`  • ${s.serviceId}: ${s.name}`);
      });
    }
    
    console.log('\n─'.repeat(60));
    console.log('✅ Database seeding complete!');
    console.log('🔗 QR codes will link to: /rate/{serviceId}');
    console.log('   Example: /rate/SVC-TOILET-001');
    
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
