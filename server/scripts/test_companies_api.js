async function check() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'krantishantveer@gmail.com', password: 'Kranti@123' })
  });
  const { token } = await loginRes.json();
  const res = await fetch('http://localhost:5000/api/companies', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(`Total Companies: ${data.data?.length}`);
  data.data?.forEach(c => console.log(`- ${c.name} | ${c.industry} | ${c.notes}`));
}
check();

