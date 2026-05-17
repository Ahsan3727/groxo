import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';

const ActiveOrderContext = createContext();

// Mock order generator
let mockOrder = null;
const createMockOrder = () => ({
  _id: 'order-' + Date.now(),
  pickupAddress: '123 Market St',
  deliveryAddress: '456 Home Ave',
  estimatedEarnings: 150,
  items: [
    { name: 'Banana', qty: 2 },
    { name: 'Milk 1L', qty: 1 },
  ],
  status: 'pending',
});

export const ActiveOrderProvider = ({ children }) => {
  const [activeOrder, setActiveOrder] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  const goOnline = () => {
    setIsOnline(true);
    // After 5 seconds, generate a mock order alert
    setTimeout(() => {
      setPendingOrder(createMockOrder());
    }, 5000);
  };

  const goOffline = () => {
    setIsOnline(false);
    setPendingOrder(null);
  };

  const acceptOrder = (order) => {
    setActiveOrder({ ...order, status: 'accepted' });
    setPendingOrder(null);
  };

  const declineOrder = (order) => {
    // In a real app, call API
    setPendingOrder(null);
  };

  const updateOrderStatus = (newStatus) => {
    if (!activeOrder) return;
    setActiveOrder(prev => ({ ...prev, status: newStatus }));
  };

  const completeOrder = () => {
    setActiveOrder(null);
  };

  return (
    <ActiveOrderContext.Provider value={{
      activeOrder, isOnline, goOnline, goOffline,
      pendingOrder, acceptOrder, declineOrder, updateOrderStatus, completeOrder
    }}>
      {children}
    </ActiveOrderContext.Provider>
  );
};

export const useActiveOrder = () => useContext(ActiveOrderContext);
