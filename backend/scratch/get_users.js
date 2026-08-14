const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('devpulse');
    const users = database.collection('users');
    const allUsers = await users.find({}).toArray();
    console.log(allUsers.map(u => ({ name: u.name, github: u.githubUsername, leetcode: u.leetcodeUsername })));
  } finally {
    await client.close();
  }
}

main().catch(console.dir);
