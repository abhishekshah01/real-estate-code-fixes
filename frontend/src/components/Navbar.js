import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, User, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Navbar = () => {
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languageOptions = {
    en: { name: 'English', flag: '🇺🇸' },
    es: { name: 'Español', flag: '🇪🇸' },
    zh: { name: '中文', flag: '🇨🇳' },
    hi: { name: 'हिंदी', flag: '🇮🇳' },
    ar: { name: 'العربية', flag: '🇸🇦' }
  };

  const navLinks = [
    { path: '/properties', label: t('nav.properties') },
    { path: '/agents', label: t('nav.agents') },
    { path: '/areas', label: t('nav.areas') },
    { path: '/calculator', label: t('nav.calculator') },
    { path: '/contact', label: t('nav.contact') },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isHomePage = location.pathname === '/';
  const navBg = isHomePage && !scrolled
    ? 'bg-transparent border-transparent'
    : 'glass border-stone-200/40 shadow-sm';
  const textColor = isHomePage && !scrolled ? 'text-white/70 hover:text-white' : '';
  const logoColor = isHomePage && !scrolled ? 'text-white' : 'text-stone-900';
  const activeColor = isHomePage && !scrolled ? 'text-white' : 'text-[#C2410C]';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${navBg}`}
      data-testid="navbar"
    >
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link
            to="/"
            className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-300 ${logoColor}`}
            data-testid="logo-link"
          >
            EstateX
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[13px] uppercase tracking-[0.06em] font-semibold transition-colors duration-200 ${
                  isActive(link.path) ? activeColor : `${textColor || 'text-stone-500 hover:text-stone-900'}`
                }`}
                data-testid={`nav-${link.path.replace('/', '') || 'home'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors focus:outline-none rounded-lg ${
                  textColor || 'text-stone-500 hover:text-stone-900'
                }`}
                data-testid="language-dropdown"
              >
                <span className="text-base">{languageOptions[language]?.flag}</span>
                <span className="hidden xl:inline text-[13px] font-semibold uppercase tracking-wider">
                  {language}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`flex items-center gap-3 cursor-pointer ${language === lang ? 'bg-stone-50' : ''}`}
                    data-testid={`lang-${lang}`}
                  >
                    <span className="text-lg">{languageOptions[lang]?.flag}</span>
                    <span className="text-sm">{languageOptions[lang]?.name}</span>
                    {language === lang && <span className="ml-auto text-[#C2410C] text-xs font-bold">&#10003;</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/admin" className={`text-[13px] uppercase tracking-[0.06em] font-semibold transition-colors ${textColor || 'text-stone-500 hover:text-stone-900'}`} data-testid="nav-admin">
                  {t('nav.admin')}
                </Link>
                <button onClick={logout} className={`flex items-center gap-2 text-sm transition-colors ${textColor || 'text-stone-500 hover:text-stone-900'}`} data-testid="logout-btn">
                  <User className="w-4 h-4" />
                  <span className="hidden xl:inline text-[13px] font-medium">{user?.name?.split(' ')[0]}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/admin"
                className="inline-flex items-center justify-center h-10 px-6 text-[13px] uppercase tracking-[0.06em] font-semibold bg-[#C2410C] text-white rounded-lg hover:bg-[#9A3412] transition-colors duration-200"
                data-testid="login-btn"
              >
                {t('nav.admin')}
              </Link>
            )}
          </div>

          <button
            className={`lg:hidden p-2 transition-colors ${isHomePage && !scrolled ? 'text-white' : 'text-stone-900'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed left-0 right-0 bottom-0 bg-white overflow-hidden transition-all duration-300 ease-out ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        style={{ zIndex: 9998, top: '64px' }}
        data-testid="mobile-menu"
      >
        <div className="flex flex-col p-5 sm:p-6 h-full overflow-y-auto">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}
                className={`py-3.5 text-lg font-medium border-b border-stone-100 transition-colors ${isActive(link.path) ? 'text-[#C2410C]' : 'text-stone-600'}`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid={`mobile-nav-${link.path.replace('/', '') || 'home'}`}>
                {link.label}
              </Link>
            ))}
            <Link to="/admin" className="py-3.5 text-lg font-medium border-b border-stone-100 text-stone-600"
              onClick={() => setMobileMenuOpen(false)} data-testid="mobile-nav-admin">
              {t('nav.admin')}
            </Link>
          </div>

          <div className="pt-6 mt-auto border-t border-stone-100">
            <p className="text-xs uppercase tracking-[0.15em] text-stone-400 font-semibold mb-3">Language</p>
            <div className="flex flex-wrap gap-2">
              {availableLanguages.map((lang) => (
                <button key={lang} onClick={() => { setLanguage(lang); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${language === lang ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
                  data-testid={`mobile-lang-${lang}`}>
                  <span>{languageOptions[lang]?.flag}</span>
                  <span>{languageOptions[lang]?.name}</span>
                </button>
              ))}
            </div>
          </div>

          {isAuthenticated && (
            <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="mt-4 btn-secondary w-full" data-testid="mobile-logout-btn">
              {t('nav.logout')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
