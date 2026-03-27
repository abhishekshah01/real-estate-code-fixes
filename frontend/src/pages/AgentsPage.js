import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Phone, Mail, Users, Home, Award, RefreshCw, MessageCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AgentsPage = () => {
  const { t } = useLanguage();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/agents`);
        setAgents(response.data);
      } catch (error) {
        console.error('Error fetching agents:', error);
        // Fallback to empty array
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] pt-16 sm:pt-20 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#C2410C] animate-spin mx-auto mb-3" />
          <p className="text-stone-400 text-sm">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-16 sm:pt-20" data-testid="agents-page">
      {/* Hero Header */}
      <div className="relative bg-stone-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(194,65,12,0.3), transparent 50%), radial-gradient(circle at 80% 50%, rgba(194,65,12,0.15), transparent 50%)'}} />
        </div>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-12 sm:py-16 md:py-20 relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-[#EA580C] text-xs font-bold uppercase tracking-[0.2em] mb-3">{t('agents.meetTeam')}</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">{t('agents.title')}</h1>
            <p className="text-stone-400 max-w-xl text-sm sm:text-base">{t('agents.subtitle')}</p>
          </motion.div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-12 sm:py-16 md:py-24">
        {agents.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No agents found. Add agents from the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.agent_id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden border border-stone-100 group hover:shadow-xl transition-all duration-500"
                data-testid={`agent-card-${agent.agent_id}`}
              >
                {/* Agent Image */}
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={agent.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={agent.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-xl font-semibold tracking-tight">{agent.name}</p>
                    <p className="text-orange-300 text-sm font-medium">{agent.role}</p>
                  </div>
                </div>

                {/* Agent Info */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-orange-50 text-[#C2410C] text-xs font-semibold rounded-full">
                      {agent.specialization}
                    </span>
                  </div>

                  <p className="text-stone-500 text-sm mb-5 line-clamp-3">{agent.bio}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-6 mb-5 pb-5 border-b border-stone-100">
                    <div className="text-center">
                      <p className="text-sm font-bold text-stone-900">{agent.stats_sales}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wide">Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-stone-900">{agent.stats_experience} yrs</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wide">Experience</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#C2410C]">★ {agent.stats_rating}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wide">Rating</p>
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="flex justify-center gap-2">
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex items-center justify-center gap-2 h-10 px-5 bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-200 transition-colors"
                    >
                      <span className="text-base">📞</span>
                      <span>Call</span>
                    </a>
                    <a
                      href={`mailto:${agent.email}`}
                      className="flex items-center justify-center gap-2 h-10 px-5 bg-[#C2410C] text-white text-xs font-semibold rounded-lg hover:bg-[#9A3412] transition-colors"
                    >
                      <span className="text-base">✉️</span>
                      <span>Email</span>
                    </a>
                    <a
                      href={`https://wa.me/${agent.phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-10 px-5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      <span className="text-base">💬</span>
                      <span>Message</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsPage;
