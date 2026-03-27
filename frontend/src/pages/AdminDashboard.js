import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Home, Users, FileText, TrendingUp, Mail, Phone, Calendar,
  Search, Download, Filter, Eye, Trash2, LogOut, RefreshCw, Plus, Upload, X, Image, MapPin, Edit2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddAgentForm, setShowAddAgentForm] = useState(false);
  const [showAddAreaForm, setShowAddAreaForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editingAgent, setEditingAgent] = useState(null);
  const [editingArea, setEditingArea] = useState(null);
  const [newProperty, setNewProperty] = useState({
    title: '', description: '', price: '', property_type: 'house', bedrooms: '3', bathrooms: '2',
    area: '', location: '', address: '', city: '', country: 'USA', images: [], features: '',
    is_featured: false, status: 'available', whatsapp_number: ''
  });
  const [newAgent, setNewAgent] = useState({
    name: '', role: '', specialization: '', phone: '', email: '', bio: '', image: '',
    stats_sales: '0+', stats_experience: '0', stats_rating: '5.0'
  });
  const [newArea, setNewArea] = useState({
    name: '', state: '', description: '', image: '', avg_price: '$0', properties_count: 0,
    price_change: '+0%', highlights: [], walk_score: 0, transit_score: 0, bike_score: 0,
    amenities: [], school_rating: 0, safety_rating: 0, lifestyle_rating: 0
  });
  const [imageUrl, setImageUrl] = useState('');

  const COLORS = ['#C2410C', '#9A3412', '#10B981', '#3B82F6', '#8B5CF6'];

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    if (!token || !user) { navigate('/admin/login'); return; }
    setAdminUser(JSON.parse(user));
    fetchDashboardData(token);
  }, [navigate]);

  const fetchDashboardData = async (token) => {
    try {
      setLoading(true);
      const [analyticsRes, inquiriesRes, propertiesRes, agentsRes, areasRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/inquiries`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/properties`),
        axios.get(`${API_URL}/api/agents`),
        axios.get(`${API_URL}/api/areas`)
      ]);
      setAnalytics(analyticsRes.data);
      setInquiries(inquiriesRes.data);
      setProperties(propertiesRes.data);
      setAgents(agentsRes.data);
      setAreas(areasRes.data);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('admin_token');
    if (token) fetchDashboardData(token);
  };

  const handleUpdateStatus = async (inquiryId, newStatus) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(`${API_URL}/api/inquiries/${inquiryId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setInquiries(inquiries.map(inq => inq.inquiry_id === inquiryId ? { ...inq, status: newStatus } : inq));
    } catch (err) { console.error('Failed to update status', err); }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('Delete this inquiry?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API_URL}/api/inquiries/${inquiryId}`, { headers: { Authorization: `Bearer ${token}` } });
      setInquiries(inquiries.filter(inq => inq.inquiry_id !== inquiryId));
    } catch (error) { console.error('Error deleting:', error); }
  };

  const handleMarkAsRead = async (inquiryId) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(`${API_URL}/api/inquiries/${inquiryId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setInquiries(inquiries.map(inq => inq.inquiry_id === inquiryId ? { ...inq, is_read: true } : inq));
    } catch (error) { console.error('Error marking:', error); }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Message', 'Date', 'Status'];
    const csvData = inquiries.map(inq => [
      inq.name, inq.email, inq.phone || 'N/A', inq.inquiry_type, inq.message,
      new Date(inq.created_at).toLocaleDateString(), inq.status || 'New'
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setNewProperty({ ...newProperty, images: [...newProperty.images, imageUrl.trim()] });
      setImageUrl('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Max 10MB');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = `${API_URL}${res.data.url}`;
      setNewProperty(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    }
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setNewProperty({ ...newProperty, images: newProperty.images.filter((_, i) => i !== index) });
  };

  const handleAddProperty = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const payload = {
        ...newProperty,
        price: parseFloat(newProperty.price),
        bedrooms: parseInt(newProperty.bedrooms),
        bathrooms: parseInt(newProperty.bathrooms),
        area: parseFloat(newProperty.area),
        features: newProperty.features.split(',').map(f => f.trim()).filter(Boolean)
      };
      await axios.post(`${API_URL}/api/properties`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddForm(false);
      setNewProperty({ title: '', description: '', price: '', property_type: 'house', bedrooms: '3', bathrooms: '2', area: '', location: '', address: '', city: '', country: 'USA', images: [], features: '', is_featured: false, status: 'available', whatsapp_number: '' });
      handleRefresh();
    } catch (error) { console.error('Error adding property:', error); alert('Error adding property. Please check all fields.'); }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Delete this property?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API_URL}/api/properties/${propertyId}`, { headers: { Authorization: `Bearer ${token}` } });
      setProperties(properties.filter(p => p.property_id !== propertyId));
    } catch (error) { console.error('Error deleting:', error); }
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setNewProperty({
      title: property.title || '', description: property.description || '', price: String(property.price || ''),
      property_type: property.property_type || 'house', bedrooms: String(property.bedrooms || '3'),
      bathrooms: String(property.bathrooms || '2'), area: String(property.area || ''),
      location: property.location || '', address: property.address || '', city: property.city || '',
      country: property.country || 'USA', images: property.images || [],
      features: (property.features || []).join(', '), is_featured: property.is_featured || false,
      status: property.status || 'available', whatsapp_number: property.whatsapp_number || ''
    });
    setShowAddForm(true);
    setSelectedProperty(null);
  };

  const handleUpdateProperty = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const payload = {
        ...newProperty,
        price: parseFloat(newProperty.price),
        bedrooms: parseInt(newProperty.bedrooms),
        bathrooms: parseInt(newProperty.bathrooms),
        area: parseFloat(newProperty.area),
        features: typeof newProperty.features === 'string' ? newProperty.features.split(',').map(f => f.trim()).filter(Boolean) : newProperty.features
      };
      await axios.put(`${API_URL}/api/properties/${editingProperty.property_id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddForm(false);
      setEditingProperty(null);
      setNewProperty({ title: '', description: '', price: '', property_type: 'house', bedrooms: '3', bathrooms: '2', area: '', location: '', address: '', city: '', country: 'USA', images: [], features: '', is_featured: false, status: 'available', whatsapp_number: '' });
      handleRefresh();
    } catch (error) { console.error('Error updating property:', error); alert('Error updating property. Please check all fields.'); }
  };

  // ==================== AGENT CRUD ====================
  const handleAddAgent = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.post(`${API_URL}/api/agents`, newAgent, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddAgentForm(false);
      setNewAgent({ name: '', role: '', specialization: '', phone: '', email: '', bio: '', image: '', stats_sales: '0+', stats_experience: '0', stats_rating: '5.0' });
      handleRefresh();
    } catch (error) { console.error('Error adding agent:', error); alert('Error adding agent. Please check all fields.'); }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent) return;
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(`${API_URL}/api/agents/${editingAgent.agent_id}`, newAgent, { headers: { Authorization: `Bearer ${token}` } });
      setEditingAgent(null);
      setShowAddAgentForm(false);
      setNewAgent({ name: '', role: '', specialization: '', phone: '', email: '', bio: '', image: '', stats_sales: '0+', stats_experience: '0', stats_rating: '5.0' });
      handleRefresh();
    } catch (error) { console.error('Error updating agent:', error); alert('Error updating agent.'); }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Delete this agent?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API_URL}/api/agents/${agentId}`, { headers: { Authorization: `Bearer ${token}` } });
      setAgents(agents.filter(a => a.agent_id !== agentId));
    } catch (error) { console.error('Error deleting agent:', error); }
  };

  const startEditAgent = (agent) => {
    setEditingAgent(agent);
    setNewAgent({
      name: agent.name, role: agent.role, specialization: agent.specialization,
      phone: agent.phone, email: agent.email, bio: agent.bio, image: agent.image,
      stats_sales: agent.stats_sales, stats_experience: agent.stats_experience, stats_rating: agent.stats_rating
    });
    setShowAddAgentForm(true);
  };

  // ==================== AREA CRUD ====================
  const handleAddArea = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const payload = {
        ...newArea,
        properties_count: parseInt(newArea.properties_count) || 0,
        walk_score: parseInt(newArea.walk_score) || 0,
        transit_score: parseInt(newArea.transit_score) || 0,
        bike_score: parseInt(newArea.bike_score) || 0,
        school_rating: parseFloat(newArea.school_rating) || 0,
        safety_rating: parseFloat(newArea.safety_rating) || 0,
        lifestyle_rating: parseFloat(newArea.lifestyle_rating) || 0,
        highlights: typeof newArea.highlights === 'string' ? newArea.highlights.split(',').map(h => h.trim()).filter(Boolean) : newArea.highlights,
        amenities: typeof newArea.amenities === 'string' ? newArea.amenities.split(',').map(a => a.trim()).filter(Boolean) : newArea.amenities
      };
      await axios.post(`${API_URL}/api/areas`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddAreaForm(false);
      setNewArea({ name: '', state: '', description: '', image: '', avg_price: '$0', properties_count: 0, price_change: '+0%', highlights: [], walk_score: 0, transit_score: 0, bike_score: 0, amenities: [], school_rating: 0, safety_rating: 0, lifestyle_rating: 0 });
      handleRefresh();
    } catch (error) { console.error('Error adding area:', error); alert('Error adding area. Please check all fields.'); }
  };

  const handleUpdateArea = async () => {
    if (!editingArea) return;
    const token = localStorage.getItem('admin_token');
    try {
      const payload = {
        ...newArea,
        properties_count: parseInt(newArea.properties_count) || 0,
        walk_score: parseInt(newArea.walk_score) || 0,
        transit_score: parseInt(newArea.transit_score) || 0,
        bike_score: parseInt(newArea.bike_score) || 0,
        school_rating: parseFloat(newArea.school_rating) || 0,
        safety_rating: parseFloat(newArea.safety_rating) || 0,
        lifestyle_rating: parseFloat(newArea.lifestyle_rating) || 0,
        highlights: typeof newArea.highlights === 'string' ? newArea.highlights.split(',').map(h => h.trim()).filter(Boolean) : newArea.highlights,
        amenities: typeof newArea.amenities === 'string' ? newArea.amenities.split(',').map(a => a.trim()).filter(Boolean) : newArea.amenities
      };
      await axios.put(`${API_URL}/api/areas/${editingArea.area_id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setEditingArea(null);
      setShowAddAreaForm(false);
      setNewArea({ name: '', state: '', description: '', image: '', avg_price: '$0', properties_count: 0, price_change: '+0%', highlights: [], walk_score: 0, transit_score: 0, bike_score: 0, amenities: [], school_rating: 0, safety_rating: 0, lifestyle_rating: 0 });
      handleRefresh();
    } catch (error) { console.error('Error updating area:', error); alert('Error updating area.'); }
  };

  const handleDeleteArea = async (areaId) => {
    if (!window.confirm('Delete this area?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API_URL}/api/areas/${areaId}`, { headers: { Authorization: `Bearer ${token}` } });
      setAreas(areas.filter(a => a.area_id !== areaId));
    } catch (error) { console.error('Error deleting area:', error); }
  };

  const startEditArea = (area) => {
    setEditingArea(area);
    setNewArea({
      name: area.name, state: area.state, description: area.description, image: area.image,
      avg_price: area.avg_price, properties_count: area.properties_count, price_change: area.price_change,
      highlights: area.highlights?.join(', ') || '', walk_score: area.walk_score, transit_score: area.transit_score,
      bike_score: area.bike_score, amenities: area.amenities?.join(', ') || '',
      school_rating: area.school_rating, safety_rating: area.safety_rating, lifestyle_rating: area.lifestyle_rating
    });
    setShowAddAreaForm(true);
  };

  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch = inq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchTerm.toLowerCase()) || inq.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || (inq.status || 'New') === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#C2410C] animate-spin mx-auto mb-3" />
          <p className="text-stone-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'leads', label: `Leads (${inquiries.length})`, icon: Users },
    { id: 'properties', label: `Properties (${properties.length})`, icon: Home },
    { id: 'agents', label: `Agents (${agents.length})`, icon: Users },
    { id: 'areas', label: `Areas (${areas.length})`, icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-stone-50" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-stone-900 tracking-tight">EstateX Admin</h1>
              <p className="text-xs text-stone-400">Welcome, {adminUser?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-stone-100 transition-colors" title="Refresh" data-testid="refresh-btn">
                <RefreshCw className="w-4 h-4 text-stone-500" />
              </button>
              <button onClick={handleLogout}
                className="flex items-center gap-2 h-9 px-4 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-stone-800 transition-colors" data-testid="admin-logout-btn">
                <LogOut className="w-3.5 h-3.5" /><span>Logout</span>
              </button>
            </div>
          </div>

          <div className="flex gap-6 mt-5">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id ? 'border-[#C2410C] text-[#C2410C]' : 'border-transparent text-stone-400 hover:text-stone-700'
                }`} data-testid={`tab-${tab.id}`}>
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Home, color: 'text-[#C2410C]', value: analytics.total_properties, label: 'Total Properties' },
                { icon: FileText, color: 'text-blue-600', value: analytics.total_inquiries, label: 'Total Inquiries' },
                { icon: Mail, color: 'text-emerald-600', value: analytics.unread_inquiries, label: 'Unread Inquiries' },
                { icon: TrendingUp, color: 'text-violet-600', value: analytics.inquiries_trend?.reduce((sum, day) => sum + day.count, 0) || 0, label: 'Leads (7 Days)' },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-xl border border-stone-100 p-5" data-testid={`stat-card-${i}`}>
                  <div className="flex items-center justify-between mb-3">
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                    <span className="text-2xl font-semibold text-stone-900">{card.value}</span>
                  </div>
                  <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider">{card.label}</h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-stone-100 p-6">
                <h3 className="text-sm font-semibold text-stone-900 mb-4">Properties by Type</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={analytics.properties_by_type} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label>
                      {analytics.properties_by_type.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-stone-100 p-6">
                <h3 className="text-sm font-semibold text-stone-900 mb-4">Properties by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.properties_by_status}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                    <XAxis dataKey="_id" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                    <Tooltip /><Bar dataKey="count" fill="#C2410C" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-stone-100 p-6">
                <h3 className="text-sm font-semibold text-stone-900 mb-4">Inquiries Trend (7 Days)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={analytics.inquiries_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                    <XAxis dataKey="_id" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                    <Tooltip /><Legend />
                    <Line type="monotone" dataKey="count" stroke="#C2410C" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-stone-100 p-6">
                <h3 className="text-sm font-semibold text-stone-900 mb-4">Inquiries by Type</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.inquiries_by_type}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                    <XAxis dataKey="_id" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                    <Tooltip /><Bar dataKey="count" fill="#10B981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Leads */}
        {activeTab === 'leads' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-stone-100 p-5">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="text" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:border-stone-400 transition-colors" data-testid="leads-search" />
                </div>
                <div className="flex gap-2">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:border-stone-400" data-testid="leads-filter">
                    <option value="all">All</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed-Won">Closed-Won</option>
                    <option value="Closed-Lost">Closed-Lost</option>
                  </select>
                  <button onClick={exportToCSV}
                    className="flex items-center gap-2 h-10 px-4 bg-[#C2410C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#9A3412] transition-colors" data-testid="export-csv-btn">
                    <Download className="w-3.5 h-3.5" /><span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-100">
                    <tr>
                      {['Contact', 'Type', 'Message', 'Date', 'Status', ''].map((h, i) => (
                        <th key={i} className={`px-5 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {filteredInquiries.length === 0 ? (
                      <tr><td colSpan="6" className="px-5 py-12 text-center text-stone-400 text-sm">No inquiries found</td></tr>
                    ) : filteredInquiries.map((inq) => (
                      <tr key={inq.inquiry_id} className="hover:bg-stone-50/50 transition-colors" data-testid={`inquiry-row-${inq.inquiry_id}`}>
                        <td className="px-5 py-4">
                          <div className="font-medium text-sm text-stone-900">{inq.name}</div>
                          <div className="text-xs text-stone-400">{inq.email}</div>
                          {inq.phone && <div className="text-xs text-stone-400">{inq.phone}</div>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600">{inq.inquiry_type}</span>
                        </td>
                        <td className="px-5 py-4 max-w-xs"><p className="text-xs text-stone-500 truncate">{inq.message}</p></td>
                        <td className="px-5 py-4 text-xs text-stone-400">{new Date(inq.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <select
                            value={inq.status || 'New'}
                            onChange={(e) => handleUpdateStatus(inq.inquiry_id, e.target.value)}
                            data-testid={`status-dropdown-${inq.inquiry_id}`}
                            className={`px-2 py-1 text-xs font-semibold rounded border cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-300 ${
                              {
                                'New': 'bg-amber-50 text-amber-700 border-amber-200',
                                'Contacted': 'bg-blue-50 text-blue-700 border-blue-200',
                                'Qualified': 'bg-violet-50 text-violet-700 border-violet-200',
                                'Negotiation': 'bg-orange-50 text-orange-700 border-orange-200',
                                'Closed-Won': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                'Closed-Lost': 'bg-red-50 text-red-700 border-red-200',
                              }[inq.status || 'New'] || 'bg-stone-50 text-stone-600 border-stone-200'
                            }`}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Closed-Won">Closed-Won</option>
                            <option value="Closed-Lost">Closed-Lost</option>
                          </select>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!inq.is_read && (
                              <button onClick={() => handleMarkAsRead(inq.inquiry_id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors" title="Mark read">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => handleDeleteInquiry(inq.inquiry_id)} className="p-1.5 text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Properties */}
        {activeTab === 'properties' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-400">{properties.length} properties</p>
              <button onClick={() => { setShowAddForm(!showAddForm); setEditingProperty(null); setNewProperty({ title: '', description: '', price: '', property_type: 'house', bedrooms: '3', bathrooms: '2', area: '', location: '', address: '', city: '', country: 'USA', images: [], features: '', is_featured: false, status: 'available', whatsapp_number: '' }); }}
                className="flex items-center gap-2 h-10 px-5 bg-[#C2410C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#9A3412] transition-colors" data-testid="add-property-btn">
                {showAddForm ? <><X className="w-3.5 h-3.5" />Cancel</> : <><Plus className="w-3.5 h-3.5" />Add Property</>}
              </button>
            </div>

            {showAddForm && (
              <div className="bg-white rounded-xl border border-stone-100 p-6" data-testid="add-property-form">
                <h3 className="text-sm font-semibold text-stone-900 mb-6">{editingProperty ? 'Edit Property' : 'Add New Property'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input type="text" placeholder="Property Title *" value={newProperty.title} onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-title" />
                  <input type="number" placeholder="Price *" value={newProperty.price} onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-price" />
                  <select value={newProperty.property_type} onChange={(e) => setNewProperty({ ...newProperty, property_type: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white" data-testid="add-property-type">
                    <option value="house">House</option><option value="apartment">Apartment</option><option value="villa">Villa</option><option value="commercial">Commercial</option><option value="land">Land</option>
                  </select>
                  <select value={newProperty.status} onChange={(e) => setNewProperty({ ...newProperty, status: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 bg-white" data-testid="add-property-status">
                    <option value="available">Available</option><option value="sold">Sold</option><option value="rented">Rented</option>
                  </select>
                  <input type="number" placeholder="Bedrooms" value={newProperty.bedrooms} onChange={(e) => setNewProperty({ ...newProperty, bedrooms: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-bedrooms" />
                  <input type="number" placeholder="Bathrooms" value={newProperty.bathrooms} onChange={(e) => setNewProperty({ ...newProperty, bathrooms: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-bathrooms" />
                  <input type="number" placeholder="Area (sqft) *" value={newProperty.area} onChange={(e) => setNewProperty({ ...newProperty, area: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-area" />
                  <input type="text" placeholder="Location (e.g., Malibu, California) *" value={newProperty.location} onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-location" />
                  <input type="text" placeholder="Address *" value={newProperty.address} onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-address" />
                  <input type="text" placeholder="City *" value={newProperty.city} onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-city" />
                  <input type="text" placeholder="Country" value={newProperty.country} onChange={(e) => setNewProperty({ ...newProperty, country: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-country" />
                  <input type="tel" placeholder="WhatsApp Number (e.g. +1234567890)" value={newProperty.whatsapp_number} onChange={(e) => { const val = e.target.value.replace(/[^0-9+\-\s]/g, ''); setNewProperty({ ...newProperty, whatsapp_number: val }); }}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-whatsapp" />
                </div>
                <div className="mt-5">
                  <textarea placeholder="Description *" value={newProperty.description} onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                    className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 min-h-[80px] resize-none" data-testid="add-property-description" />
                </div>
                <div className="mt-5">
                  <input type="text" placeholder="Features (comma separated)" value={newProperty.features} onChange={(e) => setNewProperty({ ...newProperty, features: e.target.value })}
                    className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-features" />
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                    <input type="checkbox" checked={newProperty.is_featured} onChange={(e) => setNewProperty({ ...newProperty, is_featured: e.target.checked })} data-testid="add-property-featured" />
                    Featured Property
                  </label>
                </div>
                <div className="mt-5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-3">Images</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:border-stone-400" data-testid="add-property-image-url" />
                    <button onClick={handleAddImage} type="button" className="px-4 py-2.5 bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider hover:bg-stone-200 transition-colors" data-testid="add-property-add-url">Add URL</button>
                    <label className="px-4 py-2.5 bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider hover:bg-stone-200 transition-colors cursor-pointer flex items-center gap-1.5" data-testid="add-property-upload-file">
                      <Upload className="w-3.5 h-3.5" />Upload
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  {newProperty.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {newProperty.images.map((img, i) => (
                        <div key={i} className="relative group w-20 h-20 border border-stone-200 overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => handleRemoveImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-5 border-t border-stone-100 flex gap-3">
                  <button onClick={editingProperty ? handleUpdateProperty : handleAddProperty}
                    className="h-10 px-6 bg-[#C2410C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#9A3412] transition-colors" data-testid="add-property-submit">
                    {editingProperty ? 'Update Property' : 'Save Property'}
                  </button>
                  <button onClick={() => { setShowAddForm(false); setEditingProperty(null); setNewProperty({ title: '', description: '', price: '', property_type: 'house', bedrooms: '3', bathrooms: '2', area: '', location: '', address: '', city: '', country: 'USA', images: [], features: '', is_featured: false, status: 'available', whatsapp_number: '' }); }} className="h-10 px-6 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 transition-colors">Cancel</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((property) => (
                <div key={property.property_id} className="bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" data-testid={`admin-property-${property.property_id}`} onClick={() => setSelectedProperty(property)}>
                  <img src={property.images?.[0] || 'https://via.placeholder.com/400x300'} alt={property.title} className="w-full h-44 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-stone-900 mb-1.5">{property.title}</h3>
                    <p className="text-xl font-semibold text-[#C2410C] mb-2">${property.price.toLocaleString()}</p>
                    <div className="flex items-center gap-3 text-xs text-stone-400 mb-3">
                      <span>{property.bedrooms} beds</span>
                      <span>{property.bathrooms} baths</span>
                      <span>{property.area?.toLocaleString()} sqft</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        property.status === 'available' ? 'bg-emerald-50 text-emerald-700' :
                        property.status === 'sold' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>{property.status}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEditProperty(property); }} className="p-1.5 text-blue-600 hover:bg-blue-50 transition-colors" title="Edit" data-testid={`edit-property-${property.property_id}`}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProperty(property.property_id); }} className="p-1.5 text-red-500 hover:bg-red-50 transition-colors" title="Delete" data-testid={`delete-property-${property.property_id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== AGENTS TAB ==================== */}
        {activeTab === 'agents' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-400">{agents.length} agents</p>
              <button onClick={() => { setShowAddAgentForm(!showAddAgentForm); setEditingAgent(null); setNewAgent({ name: '', role: '', specialization: '', phone: '', email: '', bio: '', image: '', stats_sales: '0+', stats_experience: '0', stats_rating: '5.0' }); }}
                className="flex items-center gap-2 h-10 px-5 bg-[#C2410C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#9A3412] transition-colors" data-testid="add-agent-btn">
                {showAddAgentForm ? <><X className="w-3.5 h-3.5" />Cancel</> : <><Plus className="w-3.5 h-3.5" />Add Agent</>}
              </button>
            </div>

            {showAddAgentForm && (
              <div className="bg-white rounded-xl border border-stone-100 p-6" data-testid="add-agent-form">
                <h3 className="text-sm font-semibold text-stone-900 mb-6">{editingAgent ? 'Edit Agent' : 'Add New Agent'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input type="text" placeholder="Name *" value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Role (e.g., Senior Broker)" value={newAgent.role} onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Specialization" value={newAgent.specialization} onChange={(e) => setNewAgent({ ...newAgent, specialization: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Phone" value={newAgent.phone} onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="email" placeholder="Email *" value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Image URL" value={newAgent.image} onChange={(e) => setNewAgent({ ...newAgent, image: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Sales (e.g., 250+)" value={newAgent.stats_sales} onChange={(e) => setNewAgent({ ...newAgent, stats_sales: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Experience (years)" value={newAgent.stats_experience} onChange={(e) => setNewAgent({ ...newAgent, stats_experience: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Rating (e.g., 4.9)" value={newAgent.stats_rating} onChange={(e) => setNewAgent({ ...newAgent, stats_rating: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <textarea placeholder="Bio" value={newAgent.bio} onChange={(e) => setNewAgent({ ...newAgent, bio: e.target.value })}
                    className="md:col-span-2 border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 min-h-[100px]" />
                </div>
                <div className="mt-6 pt-5 border-t border-stone-100 flex gap-3">
                  <button onClick={editingAgent ? handleUpdateAgent : handleAddAgent}
                    className="h-10 px-6 bg-[#C2410C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#9A3412] transition-colors">
                    {editingAgent ? 'Update Agent' : 'Save Agent'}
                  </button>
                  <button onClick={() => { setShowAddAgentForm(false); setEditingAgent(null); }} className="h-10 px-6 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 transition-colors">Cancel</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {agents.map((agent) => (
                <div key={agent.agent_id} className="bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-md transition-shadow" data-testid={`admin-agent-${agent.agent_id}`}>
                  <img src={agent.image || 'https://via.placeholder.com/400x300?text=No+Image'} alt={agent.name} className="w-full h-44 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-stone-900 mb-0.5">{agent.name}</h3>
                    <p className="text-xs text-[#C2410C] font-medium mb-2">{agent.role}</p>
                    <p className="text-xs text-stone-400 mb-3">{agent.specialization}</p>
                    <div className="flex items-center gap-3 text-xs text-stone-400 mb-3">
                      <span>{agent.stats_sales} sales</span>
                      <span>{agent.stats_experience} yrs</span>
                      <span>★ {agent.stats_rating}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEditAgent(agent)} className="p-1.5 text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteAgent(agent.agent_id)} className="p-1.5 text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== AREAS TAB ==================== */}
        {activeTab === 'areas' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-400">{areas.length} areas</p>
              <button onClick={() => { setShowAddAreaForm(!showAddAreaForm); setEditingArea(null); setNewArea({ name: '', state: '', description: '', image: '', avg_price: '$0', properties_count: 0, price_change: '+0%', highlights: '', walk_score: 0, transit_score: 0, bike_score: 0, amenities: '', school_rating: 0, safety_rating: 0, lifestyle_rating: 0 }); }}
                className="flex items-center gap-2 h-10 px-5 bg-[#C2410C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#9A3412] transition-colors" data-testid="add-area-btn">
                {showAddAreaForm ? <><X className="w-3.5 h-3.5" />Cancel</> : <><Plus className="w-3.5 h-3.5" />Add Area</>}
              </button>
            </div>

            {showAddAreaForm && (
              <div className="bg-white rounded-xl border border-stone-100 p-6" data-testid="add-area-form">
                <h3 className="text-sm font-semibold text-stone-900 mb-6">{editingArea ? 'Edit Area' : 'Add New Area'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <input type="text" placeholder="Name (e.g., Malibu) *" value={newArea.name} onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="State (e.g., California)" value={newArea.state} onChange={(e) => setNewArea({ ...newArea, state: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Image URL" value={newArea.image} onChange={(e) => setNewArea({ ...newArea, image: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Avg Price (e.g., $2.5M)" value={newArea.avg_price} onChange={(e) => setNewArea({ ...newArea, avg_price: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="number" placeholder="Properties Count" value={newArea.properties_count} onChange={(e) => setNewArea({ ...newArea, properties_count: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Price Change (e.g., +8%)" value={newArea.price_change} onChange={(e) => setNewArea({ ...newArea, price_change: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="number" placeholder="Walk Score (0-100)" value={newArea.walk_score} onChange={(e) => setNewArea({ ...newArea, walk_score: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="number" placeholder="Transit Score (0-100)" value={newArea.transit_score} onChange={(e) => setNewArea({ ...newArea, transit_score: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="number" placeholder="Bike Score (0-100)" value={newArea.bike_score} onChange={(e) => setNewArea({ ...newArea, bike_score: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="number" step="0.1" placeholder="School Rating (0-10)" value={newArea.school_rating} onChange={(e) => setNewArea({ ...newArea, school_rating: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="number" step="0.1" placeholder="Safety Rating (0-10)" value={newArea.safety_rating} onChange={(e) => setNewArea({ ...newArea, safety_rating: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="number" step="0.1" placeholder="Lifestyle Rating (0-10)" value={newArea.lifestyle_rating} onChange={(e) => setNewArea({ ...newArea, lifestyle_rating: e.target.value })}
                    className="border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Highlights (comma-separated)" value={newArea.highlights} onChange={(e) => setNewArea({ ...newArea, highlights: e.target.value })}
                    className="md:col-span-2 lg:col-span-3 border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <input type="text" placeholder="Amenities (comma-separated)" value={newArea.amenities} onChange={(e) => setNewArea({ ...newArea, amenities: e.target.value })}
                    className="md:col-span-2 lg:col-span-3 border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400" />
                  <textarea placeholder="Description" value={newArea.description} onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                    className="md:col-span-2 lg:col-span-3 border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 min-h-[100px]" />
                </div>
                <div className="mt-6 pt-5 border-t border-stone-100 flex gap-3">
                  <button onClick={editingArea ? handleUpdateArea : handleAddArea}
                    className="h-10 px-6 bg-[#C2410C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#9A3412] transition-colors">
                    {editingArea ? 'Update Area' : 'Save Area'}
                  </button>
                  <button onClick={() => { setShowAddAreaForm(false); setEditingArea(null); }} className="h-10 px-6 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 transition-colors">Cancel</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {areas.map((area) => (
                <div key={area.area_id} className="bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-md transition-shadow" data-testid={`admin-area-${area.area_id}`}>
                  <img src={area.image || 'https://via.placeholder.com/400x300?text=No+Image'} alt={area.name} className="w-full h-44 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-stone-900 mb-0.5">{area.name}, {area.state}</h3>
                    <p className="text-lg font-semibold text-[#C2410C] mb-1">{area.avg_price}</p>
                    <p className="text-xs text-stone-400 mb-3 line-clamp-2">{area.description}</p>
                    <div className="flex items-center gap-3 text-xs text-stone-400 mb-3">
                      <span>{area.properties_count} properties</span>
                      <span className="text-emerald-600 font-medium">{area.price_change}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEditArea(area)} className="p-1.5 text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteArea(area.area_id)} className="p-1.5 text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedProperty(null)} data-testid="property-detail-modal">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img src={selectedProperty.images?.[0] || 'https://via.placeholder.com/800x400'} alt={selectedProperty.title} className="w-full h-64 object-cover rounded-t-xl" />
              <button onClick={() => setSelectedProperty(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors" data-testid="close-property-modal">
                <X className="w-4 h-4" />
              </button>
              <span className={`absolute top-4 left-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                selectedProperty.status === 'available' ? 'bg-emerald-500 text-white' :
                selectedProperty.status === 'sold' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
              }`}>{selectedProperty.status}</span>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900 mb-1" data-testid="modal-property-title">{selectedProperty.title}</h2>
                  <p className="text-sm text-stone-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedProperty.location}</p>
                </div>
                <p className="text-2xl font-bold text-[#C2410C]">${selectedProperty.price?.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Bedrooms', value: selectedProperty.bedrooms },
                  { label: 'Bathrooms', value: selectedProperty.bathrooms },
                  { label: 'Area', value: `${selectedProperty.area?.toLocaleString()} sqft` },
                ].map((spec, i) => (
                  <div key={i} className="text-center p-3 bg-stone-50 rounded-lg border border-stone-100">
                    <p className="font-bold text-lg text-stone-900">{spec.value}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">{spec.label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{selectedProperty.description}</p>
              </div>

              {selectedProperty.features?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.features.map((f, i) => (
                      <span key={i} className="px-3 py-1 bg-stone-50 text-stone-600 text-xs rounded-full border border-stone-100">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                {selectedProperty.address && <div><span className="text-stone-400">Address:</span> <span className="text-stone-700">{selectedProperty.address}</span></div>}
                {selectedProperty.city && <div><span className="text-stone-400">City:</span> <span className="text-stone-700">{selectedProperty.city}</span></div>}
                {selectedProperty.country && <div><span className="text-stone-400">Country:</span> <span className="text-stone-700">{selectedProperty.country}</span></div>}
                <div><span className="text-stone-400">Type:</span> <span className="text-stone-700 capitalize">{selectedProperty.property_type}</span></div>
                {selectedProperty.whatsapp_number && <div><span className="text-stone-400">WhatsApp:</span> <span className="text-stone-700">{selectedProperty.whatsapp_number}</span></div>}
                <div><span className="text-stone-400">Featured:</span> <span className="text-stone-700">{selectedProperty.is_featured ? 'Yes' : 'No'}</span></div>
              </div>

              {selectedProperty.images?.length > 1 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Gallery ({selectedProperty.images.length} images)</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedProperty.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-24 h-24 object-cover rounded-lg border border-stone-100 flex-shrink-0" />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <button onClick={() => handleEditProperty(selectedProperty)}
                  className="flex-1 h-10 flex items-center justify-center gap-2 bg-[#C2410C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#9A3412] transition-colors rounded-lg" data-testid="modal-edit-property-btn">
                  <Edit2 className="w-3.5 h-3.5" />Edit Property
                </button>
                <button onClick={() => { handleDeleteProperty(selectedProperty.property_id); setSelectedProperty(null); }}
                  className="h-10 px-5 flex items-center justify-center gap-2 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors rounded-lg" data-testid="modal-delete-property-btn">
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
