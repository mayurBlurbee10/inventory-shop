// Temporary user store - replace with your database later
const users = [
    {
      email: 'thomas@gail.com',
      password: 'test123', // In production, use hashed passwords
      name: 'Thomas'
    },
    // Add more test users as needed
  ];
  
  export async function validateUser(email, password) {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) return null;
    return user;
  }