import React, { useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#e2e8f0' }}>
      <form onSubmit={handleSubmit} style={{ background:'#fff', padding:40, borderRadius:12, boxShadow:'0 2px 10px rgba(0,0,0,0.1)', width:'100%', maxWidth:400 }}>
        <h2 style={{ textAlign:'center', marginBottom:24 }}>Admin Login</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width:'100%', padding:12, marginBottom:16, border:'1px solid #cbd5e1', borderRadius:8 }} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width:'100%', padding:12, marginBottom:16, border:'1px solid #cbd5e1', borderRadius:8 }} required />
        <button type="submit" style={{ width:'100%', padding:12, background:'#4CAF50', color:'#fff', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer' }}>Login</button>
      </form>
    </div>
  );
};

export default Login;
