import { useState, useEffect } from 'react'
import { UserIcon, MapPinIcon, LockClosedIcon, HeartIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'addresses', name: 'Addresses', icon: MapPinIcon },
    { id: 'security', name: 'Security', icon: LockClosedIcon },
  ]

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="section-title mb-8">My Account</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border p-4">
              {/* User Info */}
              <div className="text-center pb-4 border-b">
                <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-2xl font-semibold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <h2 className="mt-3 font-semibold text-gray-900">
                  {user?.first_name} {user?.last_name}
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              {/* Navigation */}
              <nav className="mt-4 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                ))}
              </nav>

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full mt-4 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && <ProfileTab user={user} onUpdate={updateProfile} />}
            {activeTab === 'addresses' && <AddressesTab />}
            {activeTab === 'security' && <SecurityTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile Tab
const ProfileTab = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onUpdate(formData)
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              className="input"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="input"
          />
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

// Addresses Tab
const AddressesTab = () => {
  const [addresses, setAddresses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const data = await authService.getAddresses()
      setAddresses(data.results || data)
    } catch {
      toast.error('Failed to load addresses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    
    try {
      await authService.deleteAddress(id)
      setAddresses(addresses.filter(a => a.id !== id))
      toast.success('Address deleted')
    } catch {
      toast.error('Failed to delete address')
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Saved Addresses</h2>
        <button
          onClick={() => {
            setEditingAddress(null)
            setShowForm(true)
          }}
          className="btn-primary"
        >
          Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No addresses saved yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{address.full_name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {address.address_line1}
                    {address.address_line2 && <>, {address.address_line2}</>}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  <p className="text-sm text-gray-600">{address.phone}</p>
                </div>
                {address.is_default_shipping && (
                  <span className="badge bg-primary-100 text-primary-700">Default</span>
                )}
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setEditingAddress(address)
                    setShowForm(true)
                  }}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      {showForm && (
        <AddressFormModal
          address={editingAddress}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false)
            fetchAddresses()
          }}
        />
      )}
    </div>
  )
}

// Address Form Modal
const AddressFormModal = ({ address, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    full_name: address?.full_name || '',
    phone: address?.phone || '',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postal_code: address?.postal_code || '',
    is_default: address?.is_default_shipping || false,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (address) {
        await authService.updateAddress(address.id, formData)
      } else {
        await authService.addAddress(formData)
      }
      toast.success(address ? 'Address updated' : 'Address added')
      onSave()
    } catch {
      toast.error('Failed to save address')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-xl font-semibold mb-6">
          {address ? 'Edit Address' : 'Add New Address'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="input"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="label">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="input"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="label">Address Line 1</label>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                className="input"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="label">Address Line 2</label>
              <input
                type="text"
                value={formData.address_line2}
                onChange={(e) => setFormData({...formData, address_line2: e.target.value})}
                className="input"
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                className="input"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="label">Postal Code</label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                className="input"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
              className="rounded text-primary-600"
            />
            <span>Set as default address</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Security Tab
const SecurityTab = () => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      await authService.changePassword({
        old_password: formData.current_password,
        new_password: formData.new_password,
      })
      toast.success('Password changed successfully')
      setFormData({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-semibold mb-6">Change Password</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="label">Current Password</label>
          <input
            type="password"
            value={formData.current_password}
            onChange={(e) => setFormData({...formData, current_password: e.target.value})}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            value={formData.new_password}
            onChange={(e) => setFormData({...formData, new_password: e.target.value})}
            className="input"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input
            type="password"
            value={formData.confirm_password}
            onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
            className="input"
            minLength={8}
            required
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}

export default ProfilePage
