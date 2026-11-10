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
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in as:', loginData.user?.name);

    const contactsRes = await fetch('http://localhost:5000/api/contacts?limit=5', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const contactsData = await contactsRes.json();

    console.log('Pagination:', contactsData.pagination);
    console.log('Contacts returned:');
    contactsData.data.forEach(c => {
      console.log(`- ${c.firstName} ${c.lastName} | ${c.email} | ${c.company?.name || 'N/A'} | ${c.position} | ${c.assignedTo?.name || 'N/A'}`);
    });
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
