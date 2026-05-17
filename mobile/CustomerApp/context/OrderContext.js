import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
const OrderContext = createContext();
export const OrderProvider = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const fetchOrders = async () => { try { const res = await api.get('/orders'); setOrders(res.data.orders || []); } catch(e) { console.log(e); } };
  const placeOrder = async (orderData) => { const res = await api.post('/orders', orderData); setCurrentOrder(res.data.order); return res.data.order; };
  const cancelOrder = async (orderId, reason) => { await api.put('/orders/' + orderId + '/status', { status: 'cancelled', reason }); fetchOrders(); };
  const rateOrder = async (orderId, rating, comment) => { await api.post('/orders/' + orderId + '/rate', { rating, comment }); fetchOrders(); };
  useEffect(() => { fetchOrders(); }, []);
  return <OrderContext.Provider value={{ currentOrder, orders, fetchOrders, placeOrder, cancelOrder, rateOrder, setCurrentOrder }}>{children}</OrderContext.Provider>;
};
export const useOrders = () => useContext(OrderContext);
