import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Spinner from './components/Spinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FuelDepartment from './pages/FuelDepartment';
import OtherExpenses from './pages/OtherExpenses';
import Vehicles from './pages/Vehicles';
import Profile from './pages/Profile';

// Icons
import { LayoutDashboard, Fuel, Wrench, Car, User, LogOut, Menu, X } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { to: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/fuel', name: 'Fuel Department', icon: <Fuel size={20} /> },
    { to: '/expenses', name: 'Expenses Log', icon: <Wrench size={20} /> },
    { to: '/vehicles', name: 'Garage', icon: <Car size={20} /> },
    { to: '/profile', name: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div 
        className="sidebar-header"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%', 
          marginBottom: '40px',
          paddingLeft: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              borderRadius: '8px',
              padding: '6px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Car size={20} />
          </div>
          <span style={{ fontWeight: '800', fontSize: '1.25rem', letterSpacing: '-0.03em', background: 'linear-gradient(90deg, #fff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            V-Track
          </span>
        </div>

        {/* Hamburger toggle button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="sidebar-toggle"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation items & Profile footer (slid in on mobile) */}
      <div className={`sidebar-menu ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)} // Close drawer on link click
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                  background: isActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(124, 58, 237, 0.25)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ color: isActive ? 'var(--color-primary)' : 'inherit' }}>
                  {link.icon}
                </span>
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer in sidebar */}
        {user && (
          <div
            style={{
              borderTop: '1px solid var(--panel-border)',
              paddingTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--panel-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{user.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user.email}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="btn btn-secondary"
              style={{
                padding: '10px 14px',
                fontSize: '0.85rem',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <Spinner size="large" />
      </div>
    );
  }

  return token ? (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div style={{ flex: 1, width: '100%' }}>
          {children}
        </div>
        <footer style={{ 
          marginTop: 'auto', 
          paddingTop: '32px', 
          paddingBottom: '8px',
          borderTop: '1px solid var(--panel-border)', 
          textAlign: 'center', 
          fontSize: '0.85rem', 
          color: 'var(--color-text-muted)',
          width: '100%'
        }}>
          Made and managed by{' '}
          <a 
            href="https://jayptlportfolio.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: 'var(--color-secondary)', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
          >
            Jay Patel
          </a>
        </footer>
      </main>
    </div>
  ) : (
    <Navigate to="/login" />
  );
};

const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <Spinner size="large" />
      </div>
    );
  }

  return !token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/fuel"
            element={
              <PrivateRoute>
                <FuelDepartment />
              </PrivateRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <PrivateRoute>
                <OtherExpenses />
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <PrivateRoute>
                <Vehicles />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
