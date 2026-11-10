async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'krantishantveer@gmail.com',
        password: 'Kranti@123'
      })
    });
    const { token } = await loginRes.json();
    const dashRes = await fetch('http://localhost:5000/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dashData = await dashRes.json();
    console.log('Dashboard Data Summary:', dashData.data);
  } catch (err) {
    console.error(err);
  }
}
test();
