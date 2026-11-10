const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function backup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Atlas for backup:', mongoose.connection.host);
    const backupDir = path.join(__dirname, 'backups', 'pre_bootcamp_backup_' + Date.now());
    fs.mkdirSync(backupDir, { recursive: true });
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (let c of collections) {
      const docs = await mongoose.connection.db.collection(c.name).find({}).toArray();
      fs.writeFileSync(path.join(backupDir, c.name + '.json'), JSON.stringify(docs, null, 2));
      console.log('Backed up ' + c.name + ': ' + docs.length + ' documents');
    }
    console.log('Backup completed successfully to:', backupDir);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
}
backup();
