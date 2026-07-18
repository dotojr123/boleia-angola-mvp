import React from 'react';
import { CarFront, Facebook, Twitter, Instagram } from 'lucide-react';

export const Footer = () => (
  <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center text-white mb-4">
          <img src="/images/logo-icon.png" alt="Logo" className="w-12 h-12 mr-3 object-contain" />
          <span className="font-bold text-lg">Boleia Angola</span>
        </div>
        <p className="text-sm leading-relaxed">
          Conectando cidades, unindo pessoas. A plataforma de caronas interurbanas mais confiável de Angola.
        </p>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4">Empresa</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="hover:text-blue-400">Sobre nós</a></li>
          <li><a href="#" className="hover:text-blue-400">Carreiras</a></li>
          <li><a href="#" className="hover:text-blue-400">Imprensa</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4">Suporte</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="hover:text-blue-400">Central de Ajuda</a></li>
          <li><a href="#" className="hover:text-blue-400">Segurança</a></li>
          <li><a href="#" className="hover:text-blue-400">Termos de Uso</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4">Social</h4>
        <div className="flex space-x-4">
          <a href="https://www.instagram.com/art.na.web/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
            <Facebook />
          </a>
          <a href="https://www.instagram.com/art.na.web/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
            <Twitter />
          </a>
          <a href="https://www.instagram.com/art.na.web/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
            <Instagram />
          </a>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs">
      © 2026 IAgencia. Todos os direitos reservados.
    </div>
  </footer>
);
