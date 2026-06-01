import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Percent, Calendar, TrendingUp, PiggyBank, Home } from 'lucide-react';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Hoisted out of CalculatorPage so it isn't remounted each render (which dropped input focus per keystroke).
const SliderField = ({ label, value, onChange, min, max, step, suffix, testId, inputTestId }) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <label className="caption">{label}</label>
      <div className="flex items-center gap-1">
        <input type="number" value={value} onChange={(e) => onChange(Math.max(min, parseFloat(e.target.value) || 0))}
          step={step} className="input-underline w-28 text-right font-semibold text-base" data-testid={inputTestId} />
        {suffix && <span className="font-semibold text-sm text-stone-500">{suffix}</span>}
      </div>
    </div>
    <Slider value={[value]} onValueChange={(val) => onChange(val[0])} min={min} max={max} step={step} data-testid={testId} />
  </div>
);

const CalculatorPage = () => {
  const { t } = useLanguage();

  const [propertyPrice, setPropertyPrice] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [loanTerm, setLoanTerm] = useState(30);
  const [interestRate, setInterestRate] = useState(6.5);
  const [mortgageResult, setMortgageResult] = useState(null);

  const [annualIncome, setAnnualIncome] = useState(150000);
  const [monthlyDebts, setMonthlyDebts] = useState(500);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [affordabilityRate, setAffordabilityRate] = useState(6.5);
  const [affordabilityResult, setAffordabilityResult] = useState(null);

  const [valuationForm, setValuationForm] = useState({
    name: '', email: '', phone: '', address: '', propertyType: 'house', bedrooms: '3', message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const calculateMortgage = () => {
    const principal = propertyPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    if (principal <= 0 || monthlyRate <= 0 || numberOfPayments <= 0) { setMortgageResult(null); return; }
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    setMortgageResult({ monthlyPayment, totalInterest: monthlyPayment * numberOfPayments - principal, totalAmount: monthlyPayment * numberOfPayments, principal });
  };

  const calculateAffordability = () => {
    const monthlyIncome = annualIncome / 12;
    const availableForHousing = Math.min(monthlyIncome * 0.28, monthlyIncome * 0.36 - monthlyDebts);
    if (availableForHousing <= 0) { setAffordabilityResult({ maxHomePrice: 0, monthlyPayment: 0, recommendedDownPayment: 0 }); return; }
    const monthlyRate = affordabilityRate / 100 / 12;
    const numberOfPayments = 30 * 12;
    const maxLoanAmount = availableForHousing * (Math.pow(1 + monthlyRate, numberOfPayments) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments));
    const maxHomePrice = maxLoanAmount / (1 - downPaymentPercent / 100);
    setAffordabilityResult({
      maxHomePrice, monthlyPayment: availableForHousing,
      recommendedDownPayment: maxHomePrice * (downPaymentPercent / 100),
      debtToIncome: ((availableForHousing + monthlyDebts) / monthlyIncome * 100).toFixed(1)
    });
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const handleValuationSubmit = async (e) => {
    e.preventDefault();
    if (!valuationForm.name.trim()) { toast.error('Please enter a valid name'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/inquiries`, {
        name: valuationForm.name.trim(), email: valuationForm.email, phone: valuationForm.phone,
        message: `Property Valuation Request\nAddress: ${valuationForm.address}\nType: ${valuationForm.propertyType}\nBedrooms: ${valuationForm.bedrooms}\nAdditional Info: ${valuationForm.message}`,
        inquiry_type: 'valuation'
      });
      toast.success(t('contact.success'));
      setValuationForm({ name: '', email: '', phone: '', address: '', propertyType: 'house', bedrooms: '3', message: '' });
    } catch { toast.error(t('contact.error')); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-16 sm:pt-20" data-testid="calculator-page">
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-8 sm:py-10">
          <p className="caption mb-2">{t('nav.calculator')}</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-3 text-stone-900 tracking-tight">{t('calculator.pageTitle')}</h1>
          <p className="text-stone-500 text-sm sm:text-base max-w-2xl">{t('calculator.pageSubtitle')}</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-10 sm:py-12 md:py-20">
        <Tabs defaultValue="mortgage" className="space-y-6 sm:space-y-8">
          <TabsList className="grid w-full max-w-xl grid-cols-3 bg-stone-100 p-1 rounded-xl" data-testid="calculator-tabs">
            <TabsTrigger value="mortgage" className="rounded-lg data-[state=active]:bg-white text-[11px] sm:text-xs uppercase tracking-wider font-semibold">{t('calculator.mortgageTab')}</TabsTrigger>
            <TabsTrigger value="affordability" className="rounded-lg data-[state=active]:bg-white text-[11px] sm:text-xs uppercase tracking-wider font-semibold">{t('calculator.affordabilityTab')}</TabsTrigger>
            <TabsTrigger value="valuation" className="rounded-lg data-[state=active]:bg-white text-[11px] sm:text-xs uppercase tracking-wider font-semibold">{t('calculator.valuationTab')}</TabsTrigger>
          </TabsList>

          {/* Mortgage */}
          <TabsContent value="mortgage">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 sm:p-8 md:p-10 rounded-xl border border-stone-200" data-testid="mortgage-calculator">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#C2410C] text-white rounded-xl"><Calculator className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{t('calculator.title')}</h2>
                    <p className="text-stone-400 text-xs">{t('calculator.subtitle')}</p>
                  </div>
                </div>
                <div className="space-y-8">
                  <SliderField label={t('calculator.propertyPrice')} value={propertyPrice} onChange={setPropertyPrice} min={100000} max={5000000} step={10000} inputTestId="property-price-input" testId="property-price-slider" />
                  <div>
                    <SliderField label={t('calculator.downPayment')} value={downPayment} onChange={setDownPayment} min={0} max={propertyPrice * 0.5} step={5000} inputTestId="down-payment-input" testId="down-payment-slider" />
                    <p className="text-xs text-stone-400 mt-2">{((downPayment / propertyPrice) * 100).toFixed(1)}% {t('calculator.ofPropertyPrice')}</p>
                  </div>
                  <SliderField label={t('calculator.loanTerm')} value={loanTerm} onChange={(v) => setLoanTerm(Math.min(30, v))} min={5} max={30} step={5} suffix={t('calculator.years')} inputTestId="loan-term-input" testId="loan-term-slider" />
                  <SliderField label={t('calculator.interestRate')} value={interestRate} onChange={(v) => setInterestRate(Math.min(15, v))} min={1} max={15} step={0.1} suffix="%" inputTestId="interest-rate-input" testId="interest-rate-slider" />
                  <button onClick={calculateMortgage} className="btn-primary w-full" data-testid="calculate-btn">{t('calculator.calculate')}</button>
                  {mortgageResult && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 pt-8 border-t border-stone-100" data-testid="mortgage-result">
                      <div className="text-center mb-8">
                        <p className="caption mb-2">{t('calculator.monthlyPayment')}</p>
                        <p className="calculator-result" data-testid="monthly-payment">{formatCurrency(mortgageResult.monthlyPayment)}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                          { icon: DollarSign, label: t('calculator.principal'), value: formatCurrency(mortgageResult.principal) },
                          { icon: Percent, label: t('calculator.totalInterest'), value: formatCurrency(mortgageResult.totalInterest) },
                          { icon: TrendingUp, label: t('calculator.totalAmount'), value: formatCurrency(mortgageResult.totalAmount) },
                        ].map((r, i) => (
                          <div key={i} className="p-4 bg-stone-50 border border-stone-100">
                            <r.icon className="w-4 h-4 mx-auto mb-2 text-stone-400" />
                            <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">{r.label}</p>
                            <p className="font-semibold text-sm text-stone-900">{r.value}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
              <div className="space-y-6">
                <div className="bg-stone-900 text-white p-6 sm:p-8 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4 tracking-tight">{t('calculator.understandingMortgage')}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed mb-5">{t('calculator.understandingMortgageText')}</p>
                  <ul className="space-y-2.5 text-sm">
                    {[t('calculator.mortgageTip1'), t('calculator.mortgageTip2'), t('calculator.mortgageTip3')].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-[#EA580C] mt-0.5">&#8226;</span><span className="text-stone-400">{tip}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white p-6 sm:p-8 rounded-xl border border-stone-200">
                  <h3 className="text-lg font-semibold mb-3 tracking-tight">{t('calculator.needExpertAdvice')}</h3>
                  <p className="text-stone-400 text-sm mb-4">{t('calculator.needExpertAdviceText')}</p>
                  <a href="/contact" className="btn-ghost">{t('common.contactUs')} &rarr;</a>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Affordability */}
          <TabsContent value="affordability">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 sm:p-8 md:p-10 rounded-xl border border-stone-200" data-testid="affordability-calculator">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl"><PiggyBank className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{t('calculator.affordabilityTitle')}</h2>
                    <p className="text-stone-400 text-xs">{t('calculator.affordabilitySubtitle')}</p>
                  </div>
                </div>
                <div className="space-y-8">
                  <SliderField label={t('calculator.annualIncome')} value={annualIncome} onChange={setAnnualIncome} min={30000} max={500000} step={5000} inputTestId="income-input" testId="income-slider" />
                  <div>
                    <SliderField label={t('calculator.monthlyDebts')} value={monthlyDebts} onChange={setMonthlyDebts} min={0} max={5000} step={50} inputTestId="debts-input" testId="debts-slider" />
                    <p className="text-xs text-stone-400 mt-2">{t('calculator.monthlyDebtsHelp')}</p>
                  </div>
                  <SliderField label={t('calculator.downPayment')} value={downPaymentPercent} onChange={(v) => setDownPaymentPercent(Math.min(100, v))} min={3} max={50} step={1} suffix="%" inputTestId="down-percent-input" testId="down-percent-slider" />
                  <SliderField label={t('calculator.interestRate')} value={affordabilityRate} onChange={(v) => setAffordabilityRate(Math.min(15, v))} min={1} max={15} step={0.1} suffix="%" inputTestId="afford-rate-input" testId="afford-rate-slider" />
                  <button onClick={calculateAffordability} className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700" data-testid="calculate-afford-btn">{t('calculator.calculateAffordability')}</button>
                  {affordabilityResult && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 pt-8 border-t border-stone-100" data-testid="affordability-result">
                      <div className="text-center mb-8">
                        <p className="caption mb-2">{t('calculator.maxHomePrice')}</p>
                        <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-emerald-600 tracking-tight" data-testid="max-price">{formatCurrency(affordabilityResult.maxHomePrice)}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                          { icon: Home, label: t('calculator.downPayment'), value: formatCurrency(affordabilityResult.recommendedDownPayment) },
                          { icon: Calendar, label: t('calculator.monthlyPayment'), value: formatCurrency(affordabilityResult.monthlyPayment) },
                          { icon: TrendingUp, label: t('calculator.debtToIncome'), value: `${affordabilityResult.debtToIncome}%` },
                        ].map((r, i) => (
                          <div key={i} className="p-4 bg-stone-50 border border-stone-100">
                            <r.icon className="w-4 h-4 mx-auto mb-2 text-stone-400" />
                            <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">{r.label}</p>
                            <p className="font-semibold text-sm text-stone-900">{r.value}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
              <div className="space-y-6">
                <div className="bg-emerald-800 text-white p-6 sm:p-8 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4 tracking-tight">{t('calculator.affordabilityGuidelines')}</h3>
                  <p className="text-emerald-200 text-sm leading-relaxed mb-5">{t('calculator.affordabilityGuidelinesText')}</p>
                  <ul className="space-y-2.5 text-sm">
                    {[t('calculator.affordabilityTip1'), t('calculator.affordabilityTip2'), t('calculator.affordabilityTip3')].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&#8226;</span><span className="text-emerald-100">{tip}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white p-6 sm:p-8 rounded-xl border border-stone-200">
                  <h3 className="text-lg font-semibold mb-3 tracking-tight">{t('calculator.readyToStart')}</h3>
                  <p className="text-stone-400 text-sm mb-4">{t('calculator.readyToStartText')}</p>
                  <a href="/properties" className="btn-ghost">{t('calculator.browseProperties')} &rarr;</a>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Valuation */}
          <TabsContent value="valuation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 sm:p-8 md:p-10 rounded-xl border border-stone-200" data-testid="valuation-form">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="w-10 h-10 flex items-center justify-center bg-stone-900 text-white rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{t('calculator.valuationTitle')}</h2>
                    <p className="text-stone-400 text-xs">{t('calculator.valuationSubtitle')}</p>
                  </div>
                </div>
                <form onSubmit={handleValuationSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder={t('contact.name')} value={valuationForm.name} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s]/g, '').replace(/^\s+/, ''); setValuationForm({ ...valuationForm, name: v }); }} className="input-underline w-full" required data-testid="valuation-name" />
                    <input type="email" placeholder={t('contact.email')} value={valuationForm.email} onChange={(e) => setValuationForm({ ...valuationForm, email: e.target.value })} className="input-underline w-full" required data-testid="valuation-email" />
                  </div>
                  <input type="tel" placeholder={t('contact.phone')} value={valuationForm.phone} onChange={(e) => { const v = e.target.value.replace(/[^0-9+\-()]/g, ''); setValuationForm({ ...valuationForm, phone: v }); }} className="input-underline w-full" data-testid="valuation-phone" />
                  <input type="text" placeholder={t('calculator.propertyAddress')} value={valuationForm.address} onChange={(e) => setValuationForm({ ...valuationForm, address: e.target.value })} className="input-underline w-full" required data-testid="valuation-address" />
                  <div className="grid grid-cols-2 gap-4">
                    <select value={valuationForm.propertyType} onChange={(e) => setValuationForm({ ...valuationForm, propertyType: e.target.value })} className="input-underline w-full bg-transparent" data-testid="valuation-type">
                      <option value="house">{t('properties.types.house')}</option>
                      <option value="apartment">{t('properties.types.apartment')}</option>
                      <option value="villa">{t('properties.types.villa')}</option>
                      <option value="commercial">{t('properties.types.commercial')}</option>
                      <option value="land">{t('properties.types.land')}</option>
                    </select>
                    <select value={valuationForm.bedrooms} onChange={(e) => setValuationForm({ ...valuationForm, bedrooms: e.target.value })} className="input-underline w-full bg-transparent" data-testid="valuation-bedrooms">
                      <option value="1">1 {t('property.bedrooms')}</option>
                      <option value="2">2 {t('property.bedrooms')}</option>
                      <option value="3">3 {t('property.bedrooms')}</option>
                      <option value="4">4 {t('property.bedrooms')}</option>
                      <option value="5">5+ {t('property.bedrooms')}</option>
                    </select>
                  </div>
                  <textarea placeholder={t('calculator.additionalInfo')} value={valuationForm.message} onChange={(e) => setValuationForm({ ...valuationForm, message: e.target.value })} className="input-underline w-full min-h-[80px] resize-none" data-testid="valuation-message" />
                  <button type="submit" disabled={submitting} className="btn-secondary w-full" data-testid="valuation-submit">
                    {submitting ? t('common.loading') : t('calculator.requestValuation')}
                  </button>
                </form>
              </motion.div>
              <div>
                <div className="bg-stone-900 text-white p-6 sm:p-8 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4 tracking-tight">{t('calculator.freeValuation')}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed mb-5">{t('calculator.freeValuationText')}</p>
                  <ul className="space-y-2.5 text-sm">
                    {[t('calculator.valuationFeature1'), t('calculator.valuationFeature2'), t('calculator.valuationFeature3'), t('calculator.valuationFeature4')].map((f, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-[#EA580C] mt-0.5">&#8226;</span><span className="text-stone-400">{f}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CalculatorPage;
