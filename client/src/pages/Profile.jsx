import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Skeleton from '../components/Skeleton';
import { User, Mail, Calendar, Car, ClipboardList, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, logout, getHeaders } = useAuth();
  const [stats, setStats] = useState({ vehiclesCount: 0, expensesCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        setLoading(true);
        const [vRes, eRes] = await Promise.all([
          fetch(`${API_URL}/api/vehicles`, { headers: getHeaders() }),
          fetch(`${API_URL}/api/expenses`, { headers: getHeaders() }),
        ]);

        if (vRes.ok && eRes.ok) {
          const vehicles = await vRes.json();
          const expenses = await eRes.json();
          setStats({
            vehiclesCount: vehicles.length,
            expensesCount: expenses.length,
          });
        }
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileStats();
  }, []);

  return (
    <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
      <div className="bg-glow-purple" />
      <div className="bg-glow-cyan" />

      <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Account Profile</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '32px' }}>
        Manage your personal account details and logs statistics
      </p>

      {loading ? (
        <Skeleton type="profile" />
      ) : (
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Avatar Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2.2rem',
                fontWeight: '700',
                boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>{user?.name}</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Member Account</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)' }} />

          {/* User Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ color: 'var(--color-primary)' }}><User size={20} /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Full Name</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{user?.name}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ color: 'var(--color-secondary)' }}><Mail size={20} /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Email Address</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{user?.email}</p>
              </div>
            </div>

            {user?.createdAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ color: 'var(--color-accent-pink)' }}><Calendar size={20} /></div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Date Registered</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)' }} />

          {/* Statistics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--panel-border)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--color-primary)', display: 'inline-flex', marginBottom: '8px' }}>
                <Car size={22} />
              </div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>{stats.vehiclesCount}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Registered Vehicles</p>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--panel-border)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--color-secondary)', display: 'inline-flex', marginBottom: '8px' }}>
                <ClipboardList size={22} />
              </div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>{stats.expensesCount}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total Expense Logs</p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            className="btn btn-danger"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}
          >
            <LogOut size={18} /> Sign Out of Account
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
