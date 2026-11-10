async function testSearch() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'krantishantveer@gmail.com', password: 'Kranti@123' })
  });
  const { token } = await loginRes.json();

  const searchRes = await fetch('http://localhost:5000/api/search?q=Vaibhav', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await searchRes.json();
  console.log('Search Results for "Vaibhav":', JSON.stringify(data.data, null, 2));

  const notifRes = await fetch('http://localhost:5000/api/notifications/unread-count', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const notifData = await notifRes.json();
  console.log('Unread Notifications for Kranti:', notifData);
}
testSearch();

