const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('http://localhost:3001/api/editor/get-areas/FreeportSIRADICA.js');
    console.log('API Response OK:', res.data.ok);
    console.log('Total Areas Found:', res.data.areas.length);
    console.log('Areas List:');
    res.data.areas.forEach((a, i) => {
      console.log(`${i + 1}. ${a.nombre}`);
    });
    
    const hasPrueba = res.data.areas.some(a => a.nombre === 'prueba');
    if (hasPrueba) {
      console.log('❌ FAIL: Area "prueba" is still present!');
    } else {
      console.log('✅ SUCCESS: Area "prueba" is filtered out.');
    }
  } catch (e) {
    console.error('Error fetching API:', e.message);
  }
}

check();
