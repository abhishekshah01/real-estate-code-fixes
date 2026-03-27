import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Home, Building, MapPin, Search, Star, Quote, Phone } from 'lucide-react';
import axios from 'axios';
import PropertyCard from '../components/PropertyCard';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/* ===== ANIMATED COUNTER ===== */
const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const numericEnd = parseInt(end.replace(/[^0-9]/g, ''));

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = Math.max(1, Math.floor(numericEnd / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= numericEnd) { setCount(numericEnd); clearInterval(timer); }
      else { setCount(start); }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, numericEnd, duration]);

  const prefix = end.includes('$') ? '$' : '';
  return (
    <span ref={ref} className="counter-animate">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

const HomePage = () => {
  const { t } = useLanguage();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seedAndFetch = async () => {
      try { await axios.post(`${API_URL}/api/seed`); } catch {}
      try {
        const response = await axios.get(`${API_URL}/api/properties?featured=true&limit=6`);
        setFeaturedProperties(response.data);
      } catch (error) {
        console.error('Error fetching featured properties:', error);
      } finally {
        setLoading(false);
      }
    };
    seedAndFetch();
  }, []);

  const agents = [
    {
      name: 'Sarah Chen',
      role: t('agents.roles.seniorBroker'),
      image: 'https://images.unsplash.com/photo-1758518727592-706e80ebc354?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
      specialization: t('agents.specializations.luxury'),
    },
    {
      name: 'Michael Rodriguez',
      role: t('agents.roles.investmentSpecialist'),
      image: 'https://images.unsplash.com/photo-1758518727984-17b37f2f0562?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
      specialization: t('agents.specializations.commercial'),
    },
    {
      name: 'Elena Williams',
      role: t('agents.roles.clientRelations'),
      image: 'https://images.unsplash.com/photo-1758691737587-7630b4d31d16?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
      specialization: t('agents.specializations.firstTime'),
    },
    {
      name: 'David Kim',
      role: t('agents.roles.marketAnalyst'),
      image: 'https://images.unsplash.com/photo-1758518729286-e8d94cc231f5?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
      specialization: t('agents.specializations.valuation'),
    }
  ];

  const testimonials = [
    {
      quote: "EstateX helped us find our dream home in just two weeks. Their attention to detail and understanding of our needs was exceptional.",
      author: "Jennifer & Mark Thompson",
      location: "Malibu, CA",
      rating: 5,
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80"
    },
    {
      quote: "The team's expertise in the luxury market is unmatched. They found us a property that exceeded all our expectations.",
      author: "Robert Chen",
      location: "Manhattan, NY",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
    },
    {
      quote: "As first-time buyers, we were nervous about the process. EstateX made everything smooth and stress-free. They truly care.",
      author: "Amanda & James Wilson",
      location: "Miami Beach, FL",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80"
    }
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center" data-testid="hero-section">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
            alt="Luxury property"
            className="w-full h-full object-cover"
          />
          <div className="hero-overlay" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 pt-32 pb-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-2xl"
          >
            <p className="text-[13px] uppercase tracking-[0.15em] text-orange-400 font-semibold mb-4">{t('hero.featured')}</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.08] mb-6 tracking-tight">
              {t('hero.title')}
            </h1>
            <p className="text-base sm:text-lg text-white/50 leading-relaxed mb-10 max-w-lg">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/properties"
                className="btn-primary bg-white text-stone-900 hover:bg-stone-100 inline-flex items-center justify-center gap-3"
                data-testid="hero-cta"
              >
                {t('hero.cta')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center h-12 px-8 text-[13px] uppercase tracking-[0.08em] font-semibold border border-white/25 text-white rounded-lg hover:bg-white/10 transition-all duration-300"
                data-testid="hero-contact"
              >
                {t('nav.contact')}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10">
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-8 sm:py-10">
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              {[
                { icon: Home, value: '500', suffix: '+', label: t('properties.title') },
                { icon: Building, value: '50', suffix: '+', label: t('areas.listings') },
                { icon: MapPin, value: '15', suffix: '+', label: t('areas.title').split(' ')[0] },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="text-center text-white"
                >
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-white/60" />
                  <p className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-white/35 uppercase tracking-[0.12em] font-semibold mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SEARCH ===== */}
      <section className="py-10 sm:py-12 bg-white border-b border-stone-100" data-testid="search-section">
        <div className="max-w-[640px] mx-auto px-5 sm:px-8">
          <Link
            to="/properties"
            className="flex items-center gap-4 p-4 sm:p-5 bg-stone-50 border border-stone-200 rounded-xl hover:border-stone-300 transition-all group hover:shadow-sm"
            data-testid="search-bar"
          >
            <Search className="w-5 h-5 text-stone-400" />
            <span className="text-stone-400 text-sm sm:text-base">{t('properties.search')}</span>
            <ArrowRight className="w-4 h-4 text-stone-300 ml-auto group-hover:text-[#C2410C] group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </section>

      {/* ===== FEATURED PROPERTIES ===== */}
      <section className="section-padding" data-testid="featured-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 sm:mb-16">
            <div>
              <p className="caption mb-2">{t('hero.featured')}</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight">{t('properties.title')}</h2>
            </div>
            <Link to="/properties" className="btn-ghost mt-4 sm:mt-0 flex items-center gap-2 text-sm" data-testid="view-all-properties">
              {t('common.showMore')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredProperties.slice(0, 6).map((property, index) => (
                <PropertyCard key={property.property_id} property={property} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="section-padding bg-stone-900 text-white" data-testid="why-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <p className="caption text-orange-400 mb-2">{t('whyUs.title')}</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6 text-white tracking-tight">{t('whyUs.heading')}</h2>
              <p className="text-stone-400 text-base sm:text-lg leading-relaxed mb-10">{t('whyUs.description')}</p>
              <Link to="/contact" className="btn-primary" data-testid="why-cta">
                {t('whyUs.getStarted')}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { number: '15', suffix: '+', label: t('whyUs.yearsExperience') },
                { number: '2500', suffix: '+', label: t('whyUs.propertiesSold') },
                { number: '98', suffix: '%', label: t('whyUs.clientSatisfaction') },
                { number: '24', suffix: '/7', label: t('whyUs.supportAvailable') }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 sm:p-8 bg-stone-800/50 rounded-xl border border-stone-700/40 hover:border-stone-600/60 transition-colors"
                >
                  <p className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#EA580C] mb-2 tracking-tight">
                    <AnimatedCounter end={item.number} suffix={item.suffix} duration={1500} />
                  </p>
                  <p className="text-stone-500 text-[11px] sm:text-xs uppercase tracking-[0.1em] font-semibold">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== MEET OUR AGENTS ===== */}
      <section className="section-padding" data-testid="agents-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
          <div className="mb-12 sm:mb-16">
            <p className="caption mb-2">{t('agents.ourTeam')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-3 text-stone-900 tracking-tight">{t('agents.meetOurAgents')}</h2>
            <p className="text-stone-500 text-base max-w-2xl">{t('agents.meetOurAgentsDesc')}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {agents.map((agent, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group hover-lift"
                data-testid={`agent-card-${index}`}
              >
                <div className="aspect-[3/4] overflow-hidden mb-4 bg-stone-100 rounded-xl">
                  <img
                    src={agent.image}
                    alt={agent.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-0.5 tracking-tight">{agent.name}</h3>
                <p className="text-[#C2410C] text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-1">{agent.role}</p>
                <p className="text-stone-400 text-xs sm:text-sm">{agent.specialization}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 sm:mt-12">
            <Link to="/agents" className="btn-secondary text-sm" data-testid="view-all-agents">
              {t('agents.viewAllAgents')}
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section-padding bg-stone-50" data-testid="testimonials-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
          <div className="mb-10 sm:mb-14">
            <p className="caption mb-2">{t('testimonials.title')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight">{t('testimonials.heading')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                data-testid={`testimonial-card-${index}`}
              >
                <div>
                  <Quote className="w-8 h-8 text-stone-200 mb-4" />
                  <p className="text-base sm:text-lg text-stone-700 leading-relaxed mb-6 tracking-tight">
                    "{testimonial.quote}"
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={testimonial.image} alt={testimonial.author}
                      className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-sm text-stone-900">{testimonial.author}</p>
                      <p className="text-stone-400 text-xs">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA / NUDGE ===== */}
      <section className="section-padding bg-white relative overflow-hidden" data-testid="cta-section">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="caption mb-2">{t('cta.title')}</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-5 text-stone-900 tracking-tight">{t('cta.heading')}</h2>
              <p className="text-stone-500 text-base sm:text-lg mb-8 leading-relaxed">{t('cta.description')}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/properties" className="btn-primary" data-testid="cta-properties">
                  {t('hero.cta')}
                </Link>
                <Link to="/calculator" className="btn-secondary" data-testid="cta-calculator">
                  {t('nav.calculator')}
                </Link>
              </div>
            </div>
            {/* Property Image Collage */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden aspect-[3/4]">
                    <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&q=80"
                      alt="Property" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="rounded-xl overflow-hidden aspect-square">
                    <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&q=80"
                      alt="Property" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                </div>
                <div className="space-y-3 pt-8">
                  <div className="rounded-xl overflow-hidden aspect-square">
                    <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=80"
                      alt="Property" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="rounded-xl overflow-hidden aspect-[3/4]">
                    <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&q=80"
                      alt="Property" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                </div>
              </div>
              {/* Floating stat card */}
              <div className="absolute -left-6 bottom-16 glass rounded-xl p-4 shadow-xl border border-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">24/7 Support</p>
                    <p className="text-xs text-stone-500">Talk to an expert</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
