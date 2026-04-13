import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, ArrowRight, Tag } from 'lucide-react';

interface TccCardProps {
  tcc: any;
  key?: any;
}

export default function TccCard({ tcc }: TccCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all"
    >
      <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden group">
        <FileText className="w-16 h-16 text-slate-300 group-hover:text-indigo-200 transition-colors" />
        <div className="absolute top-4 right-4 bg-angola-yellow px-3 py-1 rounded-full text-xs font-bold text-angola-black shadow-sm border border-angola-black/10">
          {tcc.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-angola-red/10 text-angola-red text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
            {tcc.category}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-tight">
          {tcc.title}
        </h3>
        <p className="text-slate-500 text-sm mb-6 line-clamp-2">
          {tcc.description}
        </p>
        
        <Link 
          to={`/tcc/${tcc.id}`}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-indigo-600 transition-colors group"
        >
          Ver Detalhes
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
