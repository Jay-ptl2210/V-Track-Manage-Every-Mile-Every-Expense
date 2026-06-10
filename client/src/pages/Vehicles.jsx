import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Spinner from '../components/Spinner';
import { Car, Trash2, Plus, Calendar, Disc, Edit2, Fuel } from 'lucide-react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { getHeaders } = useAuth();

  // Form states
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [year, setYear] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');

  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editLicensePlate, setEditLicensePlate] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editFuelType, setEditFuelType] = useState('Petrol');

  const startEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setEditMake(vehicle.make);
    setEditModel(vehicle.model);
    setEditLicensePlate(vehicle.licensePlate);
    setEditYear(vehicle.year || '');
    setEditFuelType(vehicle.fuelType || 'Petrol');
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    if (!editMake || !editModel || !editLicensePlate) {
      setError('Please fill in make, model and license plate');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${editingVehicle._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ make: editMake, model: editModel, licensePlate: editLicensePlate, year: editYear, fuelType: editFuelType }),
      });

      if (res.ok) {
        const updated = await res.json();
        setVehicles(vehicles.map((v) => v._id === updated._id ? updated : v));
        setEditingVehicle(null);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update vehicle');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/vehicles`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      } else {
        setError('Failed to fetch vehicles');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!make || !model || !licensePlate) {
      setError('Please fill in make, model and license plate');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/vehicles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ make, model, licensePlate, year, fuelType }),
      });

      if (res.ok) {
        const newVehicle = await res.json();
        setVehicles([newVehicle, ...vehicles]);
        // Reset form
        setMake('');
        setModel('');
        setLicensePlate('');
        setYear('');
        setFuelType('Petrol');
        setShowAddModal(false);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to add vehicle');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure? This will delete the vehicle and ALL of its associated expense logs (Fuel, Service, etc.)!')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (res.ok) {
        setVehicles(vehicles.filter((v) => v._id !== id));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete vehicle');
      }
    } catch (err) {
      console.error(err);
      alert('Server connection error');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Garage</h1>
          <p>Manage the vehicles in your fleet</p>
        </div>
        <div className="filters-container">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add Vehicle
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-danger)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Vehicles List */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Active Vehicles</h2>
          {loading ? (
            <Spinner size="large" />
          ) : vehicles.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <Car size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>No vehicles registered yet.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                Add your first vehicle in the form to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="glass-panel vehicle-card"
                  style={{
                    padding: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        color: 'var(--color-secondary)',
                      }}
                    >
                      <Car size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '0.85rem',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {vehicle.licensePlate.toUpperCase()}
                        </span>
                        {vehicle.year && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> {vehicle.year}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Fuel size={12} /> {vehicle.fuelType || 'Petrol'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => startEdit(vehicle)}
                      style={{
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                        padding: '8px',
                        borderRadius: '8px',
                        color: 'var(--color-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-secondary)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                        e.currentTarget.style.color = 'var(--color-secondary)';
                      }}
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteVehicle(vehicle._id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '8px',
                        borderRadius: '8px',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-danger)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                        e.currentTarget.style.color = 'var(--color-danger)';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2
              style={{
                fontSize: '1.25rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Plus size={20} style={{ color: 'var(--color-primary)' }} />
              Add Vehicle
            </h2>

            <form onSubmit={handleAddVehicle}>
              <div className="input-group">
                <label className="input-label">Make / Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Honda, Maruti Suzuki"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Model</label>
                <input
                  type="text"
                  placeholder="e.g. City, Swift"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="input-group">
                <label className="input-label">License Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. MH12AB1234"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Manufacture Year (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 2022"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Spinner size="small" color="white" inline />
                  ) : (
                    <>
                      <Car size={18} /> Save Vehicle
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Car size={20} style={{ color: 'var(--color-secondary)' }} />
              Edit Vehicle
            </h2>
            <form onSubmit={handleUpdateVehicle}>
              <div className="input-group">
                <label className="input-label">Make / Brand</label>
                <input
                  type="text"
                  value={editMake}
                  onChange={(e) => setEditMake(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Model</label>
                <input
                  type="text"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="input-group">
                <label className="input-label">License Plate Number</label>
                <input
                  type="text"
                  value={editLicensePlate}
                  onChange={(e) => setEditLicensePlate(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Manufacture Year (Optional)</label>
                <input
                  type="number"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label">Fuel Type</label>
                <select
                  value={editFuelType}
                  onChange={(e) => setEditFuelType(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, #0891b2 100%)' }}
                  disabled={submitting}
                >
                  {submitting ? <Spinner size="small" color="white" inline /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
