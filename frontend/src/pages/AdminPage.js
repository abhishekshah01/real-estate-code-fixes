import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Home, MessageSquare, Settings, LogOut,
  Plus, Pencil, Trash2, Eye, Check, X, Menu
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPage = () => {
  const { t } = useLanguage();
  const { user, login, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [whatsappConfig, setWhatsappConfig] = useState({
    default_number: '',
    default_message: '',
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [deletePropertyId, setDeletePropertyId] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Property form state
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    description: '',
    price: '',
    property_type: 'house',
    bedrooms: '',
    bathrooms: '',
    area: '',
    location: '',
    address: '',
    city: '',
    country: 'USA',
    images: [''],
    features: [],
    is_featured: false,
    status: 'available',
    whatsapp_number: ''
  });

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const [statsRes, propertiesRes, inquiriesRes, whatsappRes] = await Promise.all([
        axios.get(`${API_URL}/api/stats`, { withCredentials: true }),
        axios.get(`${API_URL}/api/properties`),
        axios.get(`${API_URL}/api/inquiries`, { withCredentials: true }),
        axios.get(`${API_URL}/api/whatsapp/config`)
      ]);
      
      setStats(statsRes.data);
      setProperties(propertiesRes.data);
      setInquiries(inquiriesRes.data);
      setWhatsappConfig(whatsappRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Skip if user data was passed from AuthCallback
    if (location.state?.user) {
      return;
    }
    
    if (!authLoading && isAuthenticated) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, fetchData, location.state]);

  useEffect(() => {
    // Fetch data when user comes from auth callback
    if (location.state?.user && isAuthenticated) {
      fetchData();
    }
  }, [location.state, isAuthenticated, fetchData]);

  const handleDeleteProperty = async () => {
    if (!deletePropertyId) return;
    
    try {
      await axios.delete(`${API_URL}/api/properties/${deletePropertyId}`, {
        withCredentials: true
      });
      toast.success('Property deleted successfully');
      setDeletePropertyId(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const handleMarkAsRead = async (inquiryId) => {
    try {
      await axios.put(`${API_URL}/api/inquiries/${inquiryId}/read`, {}, {
        withCredentials: true
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    try {
      await axios.delete(`${API_URL}/api/inquiries/${inquiryId}`, {
        withCredentials: true
      });
      toast.success('Inquiry deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete inquiry');
    }
  };

  const handleSaveWhatsAppConfig = async () => {
    try {
      await axios.put(`${API_URL}/api/whatsapp/config`, whatsappConfig, {
        withCredentials: true
      });
      toast.success('WhatsApp settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const openPropertyDialog = (property = null) => {
    if (property) {
      setEditingProperty(property);
      setPropertyForm({
        ...property,
        images: property.images?.length ? property.images : [''],
        price: property.price.toString(),
        bedrooms: property.bedrooms.toString(),
        bathrooms: property.bathrooms.toString(),
        area: property.area.toString()
      });
    } else {
      setEditingProperty(null);
      setPropertyForm({
        title: '',
        description: '',
        price: '',
        property_type: 'house',
        bedrooms: '',
        bathrooms: '',
        area: '',
        location: '',
        address: '',
        city: '',
        country: 'USA',
        images: [''],
        features: [],
        is_featured: false,
        status: 'available',
        whatsapp_number: ''
      });
    }
    setShowPropertyDialog(true);
  };

  const handleSaveProperty = async () => {
    try {
      const payload = {
        ...propertyForm,
        price: parseFloat(propertyForm.price),
        bedrooms: parseInt(propertyForm.bedrooms),
        bathrooms: parseInt(propertyForm.bathrooms),
        area: parseFloat(propertyForm.area),
        images: propertyForm.images.filter(img => img.trim() !== '')
      };

      if (editingProperty) {
        await axios.put(
          `${API_URL}/api/properties/${editingProperty.property_id}`,
          payload,
          { withCredentials: true }
        );
        toast.success('Property updated successfully');
      } else {
        await axios.post(`${API_URL}/api/properties`, payload, {
          withCredentials: true
        });
        toast.success('Property created successfully');
      }
      
      setShowPropertyDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error(error.response?.data?.detail || 'Failed to save property');
    }
  };

  const addImageField = () => {
    setPropertyForm({
      ...propertyForm,
      images: [...propertyForm.images, '']
    });
  };

  const updateImage = (index, value) => {
    const newImages = [...propertyForm.images];
    newImages[index] = value;
    setPropertyForm({ ...propertyForm, images: newImages });
  };

  const removeImage = (index) => {
    const newImages = propertyForm.images.filter((_, i) => i !== index);
    setPropertyForm({ ...propertyForm, images: newImages.length ? newImages : [''] });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // For now, we'll use a free image hosting service or base64
      // In production, you should upload to cloud storage (AWS S3, Cloudinary, etc.)
      
      // Convert to base64 for immediate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        
        // Add to property images
        setPropertyForm({
          ...propertyForm,
          images: [...propertyForm.images.filter(img => img !== ''), base64String]
        });
        
        setUploadingImage(false);
      };
      
      reader.onerror = () => {
        alert('Failed to read image file');
        setUploadingImage(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling image:', error);
      alert('Failed to process image');
      setUploadingImage(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Login Screen
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] pt-20 flex items-center justify-center" data-testid="admin-login">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 border border-stone-200 text-center max-w-md w-full mx-6"
        >
          <h1 className="font-serif text-3xl mb-4">{t('admin.loginRequired')}</h1>
          <p className="text-stone-600 mb-8">
            {t('admin.loginDescription')}
          </p>
          <button
            onClick={login}
            className="btn-primary w-full flex items-center justify-center gap-3"
            data-testid="google-login-btn"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('admin.loginWithGoogle')}
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading State
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] pt-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-[#EA580C] rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('admin.dashboard') },
    { id: 'properties', icon: Home, label: t('admin.properties') },
    { id: 'inquiries', icon: MessageSquare, label: t('admin.inquiries') },
    { id: 'settings', icon: Settings, label: t('admin.settings') }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-20" data-testid="admin-page">
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block admin-sidebar sticky top-20 h-[calc(100vh-5rem)]">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">{t('admin.adminLabel')}</p>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-stone-400">{user?.email}</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`admin-nav-item w-full ${activeTab === item.id ? 'active' : ''}`}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <button
            onClick={logout}
            className="admin-nav-item w-full mt-8 text-red-400 hover:text-red-300"
            data-testid="admin-logout"
          >
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40">
          <div className="flex justify-around py-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 ${
                  activeTab === item.id ? 'text-[#EA580C]' : 'text-stone-500'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 pb-24 lg:pb-12">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div data-testid="dashboard-content">
              <h1 className="font-serif text-3xl mb-8">{t('admin.dashboard')}</h1>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-6 border border-stone-200">
                  <p className="caption mb-2">{t('admin.totalProperties')}</p>
                  <p className="font-serif text-4xl text-[#EA580C]">{stats?.total_properties || 0}</p>
                </div>
                <div className="bg-white p-6 border border-stone-200">
                  <p className="caption mb-2">{t('admin.availableProperties')}</p>
                  <p className="font-serif text-4xl">{stats?.available_properties || 0}</p>
                </div>
                <div className="bg-white p-6 border border-stone-200">
                  <p className="caption mb-2">{t('admin.soldProperties')}</p>
                  <p className="font-serif text-4xl">{stats?.sold_properties || 0}</p>
                </div>
                <div className="bg-white p-6 border border-stone-200">
                  <p className="caption mb-2">{t('admin.unreadInquiries')}</p>
                  <p className="font-serif text-4xl text-[#EA580C]">{stats?.unread_inquiries || 0}</p>
                </div>
              </div>

              {/* Recent Inquiries */}
              <h2 className="font-serif text-2xl mb-6">{t('admin.recentInquiries')}</h2>
              <div className="bg-white border border-stone-200 overflow-hidden">
                {inquiries.slice(0, 5).map((inquiry) => (
                  <div
                    key={inquiry.inquiry_id}
                    className={`p-6 border-b border-stone-100 last:border-b-0 ${
                      !inquiry.is_read ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{inquiry.name}</p>
                        <p className="text-sm text-stone-500">{inquiry.email}</p>
                        <p className="text-stone-600 mt-2 line-clamp-2">{inquiry.message}</p>
                      </div>
                      {!inquiry.is_read && (
                        <span className="px-2 py-1 bg-[#EA580C] text-white text-xs font-bold">{t('common.new')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Properties */}
          {activeTab === 'properties' && (
            <div data-testid="properties-content">
              <div className="flex justify-between items-center mb-8">
                <h1 className="font-serif text-3xl">{t('admin.properties')}</h1>
                <button
                  onClick={() => openPropertyDialog()}
                  className="btn-primary flex items-center gap-2"
                  data-testid="add-property-btn"
                >
                  <Plus className="w-5 h-5" />
                  {t('admin.addProperty')}
                </button>
              </div>

              <div className="bg-white border border-stone-200 overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="bg-stone-50">
                      <th className="px-6">{t('admin.tableProperty')}</th>
                      <th className="px-6">{t('admin.tablePrice')}</th>
                      <th className="px-6">{t('admin.tableType')}</th>
                      <th className="px-6">{t('admin.tableStatus')}</th>
                      <th className="px-6">{t('admin.tableActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property.property_id} data-testid={`property-row-${property.property_id}`}>
                        <td className="px-6">
                          <div className="flex items-center gap-4">
                            <img
                              src={property.images?.[0] || 'https://via.placeholder.com/60'}
                              alt={property.title}
                              className="w-16 h-12 object-cover"
                            />
                            <div>
                              <p className="font-medium">{property.title}</p>
                              <p className="text-sm text-stone-500">{property.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 font-bold">{formatPrice(property.price)}</td>
                        <td className="px-6 capitalize">{property.property_type}</td>
                        <td className="px-6">
                          <span className={`badge-${property.status}`}>
                            {property.status}
                          </span>
                        </td>
                        <td className="px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/properties/${property.property_id}`)}
                              className="p-2 hover:bg-stone-100"
                              data-testid={`view-${property.property_id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openPropertyDialog(property)}
                              className="p-2 hover:bg-stone-100"
                              data-testid={`edit-${property.property_id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletePropertyId(property.property_id)}
                              className="p-2 hover:bg-red-50 text-red-500"
                              data-testid={`delete-${property.property_id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inquiries */}
          {activeTab === 'inquiries' && (
            <div data-testid="inquiries-content">
              <h1 className="font-serif text-3xl mb-8">{t('admin.inquiries')}</h1>

              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry.inquiry_id}
                    className={`bg-white border border-stone-200 p-6 ${
                      !inquiry.is_read ? 'border-l-4 border-l-[#EA580C]' : ''
                    }`}
                    data-testid={`inquiry-${inquiry.inquiry_id}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-lg">{inquiry.name}</p>
                        <p className="text-sm text-stone-500">{inquiry.email} • {inquiry.phone}</p>
                        <p className="text-xs text-stone-400 mt-1">
                          Type: {inquiry.inquiry_type} • 
                          {new Date(inquiry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!inquiry.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(inquiry.inquiry_id)}
                            className="p-2 hover:bg-green-50 text-green-600"
                            title={t('admin.markAsRead')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInquiry(inquiry.inquiry_id)}
                          className="p-2 hover:bg-red-50 text-red-500"
                          title={t('admin.deleteLabel')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-stone-600">{inquiry.message}</p>
                    {inquiry.property_id && (
                      <button
                        onClick={() => navigate(`/properties/${inquiry.property_id}`)}
                        className="mt-4 text-sm text-[#EA580C] hover:underline"
                      >
                        {t('admin.viewProperty')} →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div data-testid="settings-content">
              <h1 className="font-serif text-3xl mb-8">{t('admin.settings')}</h1>

              <div className="bg-white border border-stone-200 p-8 max-w-xl">
                <h2 className="font-serif text-xl mb-6">{t('admin.whatsappConfig')}</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="caption block mb-2">{t('admin.defaultNumber')}</label>
                    <input
                      type="text"
                      placeholder="+1234567890"
                      value={whatsappConfig.default_number}
                      onChange={(e) => setWhatsappConfig({
                        ...whatsappConfig,
                        default_number: e.target.value
                      })}
                      className="input-underline w-full"
                      data-testid="whatsapp-number"
                    />
                  </div>

                  <div>
                    <label className="caption block mb-2">{t('admin.defaultMessage')}</label>
                    <textarea
                      placeholder="Hello! I'm interested in your properties."
                      value={whatsappConfig.default_message}
                      onChange={(e) => setWhatsappConfig({
                        ...whatsappConfig,
                        default_message: e.target.value
                      })}
                      className="input-underline w-full min-h-[100px] resize-none"
                      data-testid="whatsapp-message"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="whatsapp-active"
                      checked={whatsappConfig.is_active}
                      onChange={(e) => setWhatsappConfig({
                        ...whatsappConfig,
                        is_active: e.target.checked
                      })}
                      className="w-5 h-5"
                      data-testid="whatsapp-active"
                    />
                    <label htmlFor="whatsapp-active">{t('admin.enableWhatsapp')}</label>
                  </div>

                  <button
                    onClick={handleSaveWhatsAppConfig}
                    className="btn-primary"
                    data-testid="save-whatsapp"
                  >
                    {t('admin.saveSettings')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePropertyId} onOpenChange={() => setDeletePropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteProperty')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              className="bg-red-500 hover:bg-red-600"
              data-testid="confirm-delete"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Property Form Dialog */}
      <Dialog open={showPropertyDialog} onOpenChange={setShowPropertyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-stone-900">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-stone-900">
              {editingProperty ? t('admin.editProperty') : t('admin.addProperty')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4 text-stone-900">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="caption block mb-2 text-stone-900">{t('admin.formTitle')} *</label>
                <input
                  type="text"
                  value={propertyForm.title}
                  onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                  className="input-underline w-full text-stone-900 bg-white"
                  required
                  data-testid="form-title"
                />
              </div>

              <div className="col-span-2">
                <label className="caption block mb-2 text-stone-900">{t('admin.formDescription')} *</label>
                <textarea
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                  className="input-underline w-full min-h-[100px] resize-none text-stone-900 bg-white"
                  required
                  data-testid="form-description"
                />
              </div>

              <div>
                <label className="caption block mb-2 text-stone-900">{t('admin.formPrice')} *</label>
                <input
                  type="number"
                  value={propertyForm.price}
                  onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })}
                  className="input-underline w-full text-stone-900 bg-white"
                  required
                  data-testid="form-price"
                />
              </div>

              <div>
                <label className="caption block mb-2 text-stone-900">{t('admin.formPropertyType')} *</label>
                <select
                  value={propertyForm.property_type}
                  onChange={(e) => setPropertyForm({ ...propertyForm, property_type: e.target.value })}
                  className="input-underline w-full bg-white text-stone-900"
                  data-testid="form-type"
                >
                  <option value="house">{t('admin.typeHouse')}</option>
                  <option value="apartment">{t('admin.typeApartment')}</option>
                  <option value="villa">{t('admin.typeVilla')}</option>
                  <option value="commercial">{t('admin.typeCommercial')}</option>
                  <option value="land">{t('admin.typeLand')}</option>
                </select>
              </div>

              <div>
                <label className="caption block mb-2 text-stone-900">{t('admin.formBedrooms')} *</label>
                <input
                  type="number"
                  value={propertyForm.bedrooms}
                  onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: e.target.value })}
                  className="input-underline w-full text-stone-900 bg-white"
                  required
                  data-testid="form-bedrooms"
                />
              </div>

              <div>
                <label className="caption block mb-2 text-stone-900">{t('admin.formBathrooms')} *</label>
                <input
                  type="number"
                  value={propertyForm.bathrooms}
                  onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: e.target.value })}
                  className="input-underline w-full text-stone-900 bg-white"
                  required
                  data-testid="form-bathrooms"
                />
              </div>

              <div>
                <label className="caption block mb-2 text-stone-900">Area (sqft) *</label>
                <input
                  type="number"
                  value={propertyForm.area}
                  onChange={(e) => setPropertyForm({ ...propertyForm, area: e.target.value })}
                  className="input-underline w-full text-stone-900 bg-white"
                  required
                  data-testid="form-area"
                />
              </div>

              <div>
                <label className="caption block mb-2 text-stone-900">{t('admin.formStatus')}</label>
                <select
                  value={propertyForm.status}
                  onChange={(e) => setPropertyForm({ ...propertyForm, status: e.target.value })}
                  className="input-underline w-full bg-white text-stone-900"
                  data-testid="form-status"
                >
                  <option value="available">{t('admin.statusAvailable')}</option>
                  <option value="sold">{t('admin.statusSold')}</option>
                  <option value="rented">{t('admin.statusRented')}</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="caption block mb-2">Location *</label>
                <input
                  type="text"
                  value={propertyForm.location}
                  onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                  className="input-underline w-full"
                  placeholder="e.g., Malibu, California"
                  required
                  data-testid="form-location"
                />
              </div>

              <div className="col-span-2">
                <label className="caption block mb-2">Address *</label>
                <input
                  type="text"
                  value={propertyForm.address}
                  onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                  className="input-underline w-full"
                  required
                  data-testid="form-address"
                />
              </div>

              <div>
                <label className="caption block mb-2">City *</label>
                <input
                  type="text"
                  value={propertyForm.city}
                  onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                  className="input-underline w-full"
                  required
                  data-testid="form-city"
                />
              </div>

              <div>
                <label className="caption block mb-2">Country</label>
                <input
                  type="text"
                  value={propertyForm.country}
                  onChange={(e) => setPropertyForm({ ...propertyForm, country: e.target.value })}
                  className="input-underline w-full"
                  data-testid="form-country"
                />
              </div>

              <div className="col-span-2">
                <label className="caption block mb-2 text-stone-900">Property Images</label>
                
                {/* File Upload Button */}
                <div className="mb-4 p-4 border-2 border-dashed border-stone-300 rounded-lg hover:border-[#EA580C] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center cursor-pointer ${
                      uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Plus className="w-8 h-8 text-stone-400 mb-2" />
                    <span className="text-sm font-medium text-stone-600">
                      {uploadingImage ? 'Uploading...' : 'Click to upload image from device'}
                    </span>
                    <span className="text-xs text-stone-400 mt-1">
                      Max size: 5MB | Formats: JPG, PNG, WebP
                    </span>
                  </label>
                </div>

                {/* URL Input Fields */}
                <div className="space-y-2">
                  <p className="text-xs text-stone-500 mb-2">Or add image URLs:</p>
                  {propertyForm.images.map((img, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={img}
                        onChange={(e) => updateImage(index, e.target.value)}
                        className="input-underline flex-1 text-stone-900 bg-white"
                        placeholder="https://example.com/image.jpg"
                        data-testid={`form-image-${index}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImageField}
                    className="text-sm text-[#EA580C] hover:underline font-medium"
                  >
                    + Add another URL
                  </button>
                </div>

                {/* Image Preview */}
                {propertyForm.images.filter(img => img !== '').length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-stone-500 mb-2">Preview:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {propertyForm.images
                        .filter(img => img !== '')
                        .map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded border border-stone-200"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                            }}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="caption block mb-2">WhatsApp Number</label>
                <input
                  type="text"
                  value={propertyForm.whatsapp_number}
                  onChange={(e) => setPropertyForm({ ...propertyForm, whatsapp_number: e.target.value })}
                  className="input-underline w-full"
                  placeholder="+1234567890"
                  data-testid="form-whatsapp"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is-featured"
                  checked={propertyForm.is_featured}
                  onChange={(e) => setPropertyForm({ ...propertyForm, is_featured: e.target.checked })}
                  className="w-5 h-5"
                  data-testid="form-featured"
                />
                <label htmlFor="is-featured">{t('admin.formFeatured')}</label>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-stone-200">
              <button
                onClick={() => setShowPropertyDialog(false)}
                className="btn-secondary"
                data-testid="form-cancel"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveProperty}
                className="btn-primary"
                data-testid="form-save"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
