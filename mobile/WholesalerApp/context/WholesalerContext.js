import React, { createContext, useState, useContext } from 'react';

const WholesalerContext = createContext();

// Mock products
const initialProducts = [
  { _id: 'p1', name: 'Organic Bananas', price: 40, stock: 50, category: 'Fruits', status: 'approved', image: 'https://via.placeholder.com/150/FFE082/000?text=Banana' },
  { _id: 'p2', name: 'Fresh Milk 1L', price: 60, stock: 20, category: 'Dairy', status: 'approved', image: 'https://via.placeholder.com/150/90CAF9/000?text=Milk' },
  { _id: 'p3', name: 'Whole Wheat Bread', price: 45, stock: 5, category: 'Bakery', status: 'pending', image: 'https://via.placeholder.com/150/A5D6A7/000?text=Bread' },
];

// Mock orders
const initialOrders = [
  {
    _id: 'o1',
    status: 'new',
    createdAt: new Date(),
    customer: { name: 'John Doe', address: '123 Home St' },
    items: [
      { product: initialProducts[0], qty: 2 },
      { product: initialProducts[1], qty: 1 },
    ],
    total: 140,
  },
];

export const WholesalerProvider = ({ children }) => {
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [earnings, setEarnings] = useState({ today: 350, week: 2100, month: 8500 });

  // ==================== Orders ====================
  const confirmOrder = (orderId) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'confirmed' } : o));
  };

  const rejectOrder = (orderId, reason) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'rejected', reason } : o));
  };

  const markOrderReady = (orderId) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'ready' } : o));
  };

  const handoverComplete = (orderId) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'completed' } : o));
    const order = orders.find(o => o._id === orderId);
    if (order) setEarnings(prev => ({ ...prev, today: prev.today + order.total }));
  };

  // ==================== Products ====================
  const addProduct = (product) => {
    const newProduct = { ...product, _id: 'p' + Date.now(), status: 'pending' };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateStock = (id, qty) => {
    setProducts(prev => prev.map(p => p._id === id ? { ...p, stock: qty } : p));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p._id !== id));
  };

  // ==================== Earnings ====================
  const requestWithdrawal = () => {
    // mock
    alert('Withdrawal request submitted!');
  };

  return (
    <WholesalerContext.Provider value={{
      products, orders, earnings,
      confirmOrder, rejectOrder, markOrderReady, handoverComplete,
      addProduct, updateStock, deleteProduct, requestWithdrawal
    }}>
      {children}
    </WholesalerContext.Provider>
  );
};

export const useWholesaler = () => useContext(WholesalerContext);
