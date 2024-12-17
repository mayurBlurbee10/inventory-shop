// This is a temporary solution until we implement Azure authentication
export const users = [
    {
      email: 'thomas@gmail.com',
      password: 'test123', // In real implementation, this would be hashed
      boxAppUserId: '12345' // The corresponding Box app user ID
    },
    {
      email: 'client1@example.com',
      password: 'client123',
      boxAppUserId: '67890'
    },
    // Add more test users as needed
  ];
  
  export function validateUser(email, password) {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (user.password !== password) return null;
    return user;
  }