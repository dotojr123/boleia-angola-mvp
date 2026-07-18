import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, ArrowRight, CarFront, User, Shield, Star, MapPin } from 'lucide-react';
import { Button } from '../../components/Button';
import { CITIES } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { AboutSection } from '../../components/AboutSection';
import { PopularRoutes } from '../../components/PopularRoutes';
import { Testimonials } from '../../components/Testimonials';
import { FeaturedDrivers } from '../../components/FeaturedDrivers';

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

const InputGroup = ({ icon: Icon, label, value, placeholder, type = "text", min, className = "", onChange }: any) => (
  <div className={`relative ${className}`}>
    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide hidden md:block">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
      </div>
      <input
        type={type}
        defaultValue={value}
        onChange={onChange}
        min={min}
        className="block w-full pl-10 pr-3 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const CityAutocomplete = ({ label, placeholder, value, onChange }: { label: string, placeholder: string, value?: string, onChange?: (val: string) => void }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (onChange) onChange(val);

    if (val.length > 0) {
      const filtered = CITIES.filter(city =>
        city.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (city: string) => {
    setInputValue(city);
    if (onChange) onChange(city);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide hidden md:block">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
          className="block w-full pl-10 pr-3 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
          placeholder={placeholder}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto border border-slate-100">
          {suggestions.map((city, index) => (
            <li
              key={index}
              onClick={() => handleSelect(city)}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-slate-700 font-medium flex items-center"
            >
              <MapPin size={14} className="mr-2 text-slate-400" />
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    date: getTodayDate()
  });

  const handleSearch = () => {
    navigate('/search', { state: searchParams });
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 pt-28 pb-32 md:pb-48 px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
          <CarFront size={600} className="text-white" />
        </div>
        <div className="absolute bottom-0 left-0 opacity-5 transform -translate-x-10 translate-y-10">
          <div className="w-96 h-96 rounded-full bg-white blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Viaje melhor,<br /> pague menos.
            </h1>
            <p className="text-blue-100 mb-8 font-medium text-lg md:text-xl max-w-lg mx-auto md:mx-0">
              A plataforma segura que conecta motoristas com assentos vazios a passageiros indo para o mesmo destino.
            </p>
            <div className="hidden md:flex space-x-4">
              <button onClick={() => navigate('/publish-ride')} className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold transition-colors">
                Publicar Carona
              </button>
              <button className="bg-transparent border-2 border-blue-400 text-white hover:bg-blue-600 px-6 py-3 rounded-xl font-bold transition-colors">
                Saiba mais
              </button>
            </div>
          </div>
          {/* Image placeholder for desktop visual balance */}
          <div className="hidden md:block relative">
            <img
              src="/images/hero-driver.jpg"
              alt="Motorista Boleia Angola"
              className="rounded-2xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 border-4 border-white/20 object-cover w-full h-full max-h-[500px]"
            />
          </div>
        </div>
      </div>

      {/* Main Search Bar (Floating) */}
      <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-20 mb-16">
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-xl shadow-blue-900/10 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <CityAutocomplete
                label="De onde?"
                placeholder="Ex: Luanda"
                onChange={(val) => setSearchParams(prev => ({ ...prev, origin: val }))}
              />
            </div>
            <div className="md:col-span-4">
              <CityAutocomplete
                label="Para onde?"
                placeholder="Ex: Benguela"
                onChange={(val) => setSearchParams(prev => ({ ...prev, destination: val }))}
              />
            </div>
            <div className="md:col-span-2">
              <InputGroup
                icon={Calendar}
                label="Data"
                placeholder="Hoje"
                type="date"
                min={getTodayDate()}
                value={searchParams.date}
                onChange={(e: any) => setSearchParams(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Button fullWidth onClick={handleSearch} className="h-[50px] md:h-[54px] text-lg font-bold shadow-lg shadow-blue-500/30">
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium About Section */}
      <AboutSection />

      {/* Popular Routes Section (New) */}
      <PopularRoutes />

      {/* Featured Drivers Section (New) */}
      <FeaturedDrivers />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Value Props & Routes */}
      {/* Value Props & Routes */}
      <div className="py-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold uppercase tracking-wider text-sm">Nossos Diferenciais</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">
              Por que escolher a Boleia Angola?
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto mt-4 text-lg">
              Segurança, economia e conforto transformando a maneira como Angola viaja.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: User,
                title: "Comunidade Verificada",
                desc: "Confiança é tudo. Todos os membros têm documentos validados e perfis verificados.",
                color: "bg-blue-500"
              },
              {
                icon: Shield,
                title: "Segurança Total",
                desc: "Sua segurança é prioridade. Monitoramento de rotas e suporte dedicado 24/7.",
                color: "bg-indigo-500"
              },
              {
                icon: Star,
                title: "Economia Inteligente",
                desc: "Viaje com conforto pagando até 70% menos que em transportes tradicionais.",
                color: "bg-teal-500"
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 ${item.color} opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150`}></div>

                <div className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform`}>
                  <item.icon size={28} />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>

  );
};
