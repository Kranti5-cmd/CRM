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
    const repRes = await fetch('http://localhost:5000/api/reports/sales', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const repData = await repRes.json();
    console.log('Real Sales Report API Data:', repData.data?.summary);
  } catch (err) {
    console.error(err);
  }
}
test();

