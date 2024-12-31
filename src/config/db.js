import sql from 'mssql';

const config = {
    user: process.env.DB_USER,        // SQL Server username
    password: process.env.DB_PASSWORD,    // SQL Server password
    server: process.env.DB_SERVER,   // SQL Server hostname, e.g., yourserver.database.windows.net
    database: process.env.DB_DATABASE,   // Your database name
    options: {
      encrypt: true,                  // Use encryption
      enableArithAbort: true          // Enable ArithAbort
    }
  };

export async function connectToDatabase() {
  try {
    await sql.connect(config);
    console.log('Connected to Azure SQL Database');
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

export default sql;
