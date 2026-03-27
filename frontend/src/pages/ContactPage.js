import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ContactPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '', inquiryType: 'general' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Please enter a valid name'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/inquiries`, { name: formData.name.trim(), email: formData.email, phone: formData.phone, message: formData.message, inquiry_type: formData.inquiryType });
      toast.success(t('contact.success'));
      setFormData({ name: '', email: '', phone: '', message: '', inquiryType: 'general' });
    } catch { toast.error(t('contact.error')); }
    finally { setSubmitting(false); }
  };

  const contactInfo = [
    { icon: MapPin, title: t('contact.visitUs'), lines: ['Default Address', 'City, State 00000'] },
    { icon: Phone, title: t('contact.callUs'), lines: ['+00000-00000', '+00000-00001'] },
    { icon: Mail, title: t('contact.emailUs'), lines: ['info@example.com', 'support@example.com'] },
    { icon: Clock, title: t('contact.officeHours'), lines: ['Mon - Fri: 9AM - 6PM', 'Sat: 10AM - 4PM'] }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-16 sm:pt-20" data-testid="contact-page">
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-8 sm:py-10">
          <p className="caption mb-2">{t('contact.subtitle')}</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight">{t('contact.title')}</h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-10 sm:py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-5 sm:mb-6 tracking-tight">{t('contact.getInTouch')}</h2>
            <p className="text-stone-500 text-sm sm:text-base leading-relaxed mb-8 sm:mb-10">{t('contact.getInTouchText')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {contactInfo.map((item, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }} className="flex gap-4" data-testid={`contact-info-${index}`}>
                  <div className="w-12 h-12 flex items-center justify-center bg-orange-50 rounded-xl flex-shrink-0">
                    <item.icon className="w-5 h-5 text-[#C2410C]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-stone-900 mb-1">{item.title}</h3>
                    {item.lines.map((line, i) => (<p key={i} className="text-stone-400 text-xs sm:text-sm">{line}</p>))}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 sm:mt-12">
              <div className="aspect-video bg-stone-100 relative overflow-hidden rounded-xl border border-stone-200">
                <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=-74.0060%2C40.7128%2C-73.9860%2C40.7328&layer=mapnik"
                  width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="Office Location" />
              </div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 sm:p-8 md:p-10 rounded-xl border border-stone-200" data-testid="contact-form-container">
            <h2 className="text-lg sm:text-xl font-semibold mb-6 sm:mb-8 tracking-tight">{t('contact.sendUsMessage')}</h2>
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" data-testid="contact-form">
              <input type="text" placeholder={t('contact.name')} value={formData.name} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s]/g, '').replace(/^\s+/, ''); setFormData({ ...formData, name: v }); }} className="input-underline w-full" required data-testid="contact-name" />
              <input type="email" placeholder={t('contact.email')} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-underline w-full" required data-testid="contact-email" />
              <input type="tel" placeholder={t('contact.phone')} value={formData.phone} onChange={(e) => { const v = e.target.value.replace(/[^0-9+\-()]/g, ''); setFormData({ ...formData, phone: v }); }} className="input-underline w-full" data-testid="contact-phone" />
              <select value={formData.inquiryType} onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })} className="input-underline w-full bg-transparent" data-testid="contact-type">
                <option value="general">{t('contact.inquiryTypes.general')}</option>
                <option value="property">{t('contact.inquiryTypes.property')}</option>
                <option value="valuation">{t('contact.inquiryTypes.valuation')}</option>
              </select>
              <textarea placeholder={t('contact.message')} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="input-underline w-full min-h-[120px] resize-none" required data-testid="contact-message" />
              <button type="submit" disabled={submitting} className="btn-primary w-full" data-testid="contact-submit">
                {submitting ? t('common.loading') : t('contact.send')}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
