import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpRight, ArrowRight, Home, Building, Users, Twitter, Linkedin, Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';

const Footer = () => {
  const { t } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) { toast.error('Please enter your email'); return; }
    toast.success('Thank you for subscribing!');
    setNewsletterEmail('');
  };

  const footerLinks = [
    { to: '/properties', label: t('nav.properties') },
    { to: '/agents', label: t('nav.agents') },
    { to: '/areas', label: t('nav.areas') },
    { to: '/calculator', label: t('nav.calculator') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <footer className="bg-stone-950 text-white relative overflow-hidden" data-testid="footer">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C2410C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#C2410C]/3 rounded-full blur-3xl pointer-events-none" />

      {/* Top CTA Bar */}
      <div className="border-b border-stone-800/60 relative">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight mb-2">Ready to find your dream home?</h3>
              <p className="text-stone-500 text-sm max-w-md">Let our expert agents guide you through the process. Schedule a free consultation today.</p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center h-12 px-8 text-[13px] uppercase tracking-[0.08em] font-semibold bg-[#C2410C] text-white rounded-lg hover:bg-[#9A3412] transition-all duration-300 gap-2 whitespace-nowrap"
              data-testid="footer-cta-btn"
            >
              Get in Touch <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 pt-12 sm:pt-16 pb-10 sm:pb-12 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <h3 className="text-2xl font-bold mb-4 tracking-tight">EstateX</h3>
            <p className="text-stone-400 leading-relaxed text-sm mb-6 max-w-xs">{t('footer.aboutText')}</p>

            {/* Quick Stats */}
            <div className="flex gap-6 mb-6">
              {[
                { icon: Home, val: '500+', lbl: 'Properties' },
                { icon: Users, val: '20+', lbl: 'Agents' },
                { icon: Building, val: '15+', lbl: 'Areas' },
              ].map((s, i) => (
                <div key={i}>
                  <s.icon className="w-4 h-4 text-[#EA580C] mb-1" />
                  <p className="text-sm font-semibold">{s.val}</p>
                  <p className="text-[9px] text-stone-600 uppercase tracking-wider">{s.lbl}</p>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              {/* X (Twitter) */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center hover:bg-orange-500 transition-all duration-300"
                data-testid="footer-social-X"
              >
                <Twitter className="w-5 h-5 text-white" />
              </a>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center hover:bg-orange-500 transition-all duration-300"
                data-testid="footer-social-linkedin"
              >
                <Linkedin className="w-5 h-5 text-white" />
              </a>
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center hover:bg-orange-500 transition-all duration-300"
                data-testid="footer-social-facebook"
              >
                <Facebook className="w-5 h-5 text-white" />
              </a>
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center hover:bg-orange-500 transition-all duration-300"
                data-testid="footer-social-instagram"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.12em] font-semibold mb-5 text-white">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}
                    className="text-stone-500 hover:text-white transition-colors text-sm flex items-center gap-1.5 group"
                    data-testid={`footer-${link.to.replace('/', '')}-link`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-700 group-hover:bg-[#C2410C] transition-colors" />
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h4 className="text-xs uppercase tracking-[0.12em] font-semibold mb-5 text-white">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-stone-500">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#EA580C" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>
                </div>
                <span className="text-sm">Default Address<br />City, State 00000</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <a href="tel:+0000000000" className="text-stone-500 hover:text-white transition-colors text-sm">+00000-00000</a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <a href="mailto:info@example.com" className="text-stone-500 hover:text-white transition-colors text-sm">info@example.com</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-3">
            <h4 className="text-xs uppercase tracking-[0.12em] font-semibold mb-5 text-white">
              {t('footer.newsletter')}
            </h4>
            <p className="text-stone-500 mb-4 text-sm">{t('footer.newsletterText')}</p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3" data-testid="newsletter-form">
              <input
                type="email"
                placeholder="Your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-4 py-3 text-white text-sm placeholder:text-stone-600 focus:outline-none focus:border-[#C2410C] transition-colors"
                data-testid="newsletter-email"
              />
              <button
                type="submit"
                className="w-full bg-[#C2410C] py-3 rounded-lg font-semibold text-xs uppercase tracking-wider hover:bg-[#9A3412] transition-colors flex items-center justify-center gap-2"
                data-testid="newsletter-submit"
              >
                {t('footer.subscribe')} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-800/40 relative">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-5 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-stone-600 text-xs">
            &copy; {new Date().getFullYear()} EstateX. {t('footer.rights')}
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-stone-600 hover:text-stone-400 transition-colors text-xs">{t('footer.privacyPolicy')}</a>
            <a href="#" className="text-stone-600 hover:text-stone-400 transition-colors text-xs">{t('footer.termsOfService')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
