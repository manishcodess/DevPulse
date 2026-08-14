const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('http://localhost:3001/leetcode/manishsharmacodes', { method: 'POST' });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

test();
