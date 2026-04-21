import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, Video, Book, GraduationCap, ArrowRight, Lock, Unlock } from 'lucide-react';

const TYPE_ICONS: any = {
  pdf: FileText,
  video: Video,
  course: Book,
  lesson: GraduationCap,
  manual: FileText,
  book: Book,
};

export default function ContentCard({ content }: any) {
  const Icon = TYPE_ICONS[content.type] || FileText;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl md:rounded-3xl border border-angola-black/5 overflow-hidden shadow-sm hover:shadow-2xl transition-all"
    >
      <div className="h-32 md:h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden group">
        {content.thumbnail_url ? (
          <img 
            src={content.thumbnail_url} 
            alt={content.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <Icon className="w-10 h-10 md:w-20 md:h-20 text-angola-black/10 group-hover:text-angola-red/20 transition-colors" />
        )}
        
        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-1 md:gap-2 items-end">
          {(content.is_free || content.isFree) ? (
            <span className="bg-green-500 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">
              Grátis
            </span>
          ) : (
            <span className="bg-angola-yellow text-angola-black px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg border border-angola-black/10">
              2.000 Kz
            </span>
          )}
        </div>

        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4">
          <span className="bg-white/90 backdrop-blur text-angola-black text-[8px] md:text-[10px] uppercase font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-sm border border-angola-black/5">
            {content.type}
          </span>
        </div>
      </div>
      
      <div className="p-3 md:p-6">
        <div className="flex items-center gap-2 mb-1 md:mb-3">
          <span className="text-angola-red text-[8px] md:text-[10px] uppercase font-black tracking-widest truncate">
            {content.category}
          </span>
        </div>
        <h3 className="text-sm md:text-xl font-black text-angola-black mb-1 md:mb-2 line-clamp-2 leading-tight">
          {content.title}
        </h3>
        <p className="text-angola-black/50 text-[10px] md:text-sm mb-3 md:mb-6 line-clamp-1 font-medium">
          {content.subtitle || content.author}
        </p>
        
        <Link 
          to={`/content/${content.id}`}
          className="w-full flex items-center justify-center gap-1 md:gap-2 bg-angola-black text-white py-2.5 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-base font-bold hover:bg-angola-red transition-all group shadow-xl shadow-black/10"
        >
          {(content.is_free || content.isFree) ? 'Aceder' : 'Desbloquear'}
          <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
