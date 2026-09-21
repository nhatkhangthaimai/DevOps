const fs = require('fs/promises');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

async function getProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(PRODUCTS_FILE, '[]', 'utf-8');
      return [];
    }
    console.error('Error reading products.json:', error);
    throw error;
  }
}

async function saveProducts(products) {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

async function getOrders() {
  try {
    const data = await fs.readFile(ORDERS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(ORDERS_FILE, '[]', 'utf-8');
      return [];
    }
    console.error('Error reading orders.json:', error);
    throw error;
  }
}

async function saveOrders(orders) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

async function getUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(USERS_FILE, '[]', 'utf-8');
      return [];
    }
    console.error('Error reading users.json:', error);
    throw error;
  }
}

async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

module.exports = {
  getProducts,
  saveProducts,
  getOrders,
  saveOrders,
  getUsers,
  saveUsers
};
