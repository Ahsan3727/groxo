import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Sidebar = ({ isOpen, onToggle, onLogout, currentPath }) => {
  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/users', icon: '👥', label: 'User Management' },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="bg-dark text-white position-fixed h-100" 
      style={{ 
        width: '250px', 
        top: 0, 
        left: 0, 
        overflowY: 'auto',
        zIndex: 1000 
      }}
    >
      {/* Brand */}
      <div className="p-3 text-center border-bottom border-secondary">
        <h4 className="mb-0">🏪 Groxo Admin</h4>
        <small className="text-muted">Management Panel</small>
      </div>

      {/* Navigation */}
      <Nav className="flex-column p-3">
        {menuItems.map((item) => (
          <Nav.Link
            key={item.path}
            as={Link}
            to={item.path}
            className={`text-white mb-1 rounded ${currentPath === item.path ? 'bg-primary' : ''}`}
            style={{ padding: '10px 15px' }}
          >
            <span className="me-2">{item.icon}</span>
            {item.label}
          </Nav.Link>
        ))}
      </Nav>

      {/* Logout Button */}
      <div className="position-absolute bottom-0 w-100 p-3 border-top border-secondary">
        <button 
          className="btn btn-outline-light w-100"
          onClick={onLogout}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;