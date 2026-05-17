import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    api.get('/admin/dashboard').then(res => {
      setStats(res.data.stats);
      setChartData(res.data.chartData || []);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:16, marginTop:16 }}>
        <div className="stat-card" style={{ background:'#fff', padding:20, borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Today Orders</h3><p style={{ fontSize:24, fontWeight:'bold' }}>{stats.todayOrders || 0}</p>
        </div>
        <div className="stat-card" style={{ background:'#fff', padding:20, borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Revenue</h3><p style={{ fontSize:24, fontWeight:'bold' }}>₹{stats.revenue || 0}</p>
        </div>
        <div className="stat-card" style={{ background:'#fff', padding:20, borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Active Riders</h3><p style={{ fontSize:24, fontWeight:'bold' }}>{stats.activeRiders || 0}</p>
        </div>
        <div className="stat-card" style={{ background:'#fff', padding:20, borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Pending Orders</h3><p style={{ fontSize:24, fontWeight:'bold' }}>{stats.pendingOrders || 0}</p>
        </div>
      </div>
      <div style={{ marginTop:32 }}>
        <h3>Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#4CAF50" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
