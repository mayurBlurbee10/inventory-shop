import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'src/app/lib/data/users.json');

export function readData() {
  try {
    const jsonData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { companies: [], adminUsers: [] };
  }
}

export function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
}

export function addCompany(company) {
  const data = readData();
  data.companies.push(company);
  return writeData(data);
}

export function getCompanies() {
  const data = readData();
  return data.companies;
}

export function getCompanyByEmail(email) {
  const data = readData();
  return data.companies.find(company => company.email === email);
}

export function validateAdminUser(email, password) {
  const data = readData();
  return data.adminUsers.find(
    user => user.email === email && user.password === password
  );
}