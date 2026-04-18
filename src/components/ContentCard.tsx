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
      className="bg-white rounded-3xl border border-angola-black/5 overflow-hidden shadow-sm hover:shadow-2xl transition-all"
    >
      <div className="h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden group">
        {content.thumbnail_url ? (
          <img 
            src={content.thumbnail_url} 
            alt={content.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <Icon className="w-20 h-20 text-angola-black/10 group-hover:text-angola-red/20 transition-colors" />
        )}
        
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          {(content.is_free || content.isFree) ? (
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              Grátis
            </span>
          ) : (
            <span className="bg-angola-yellow text-angola-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border border-angola-black/10">
              2.000 Kz
            </span>
          )}
        </div>

        <div className="absolute bottom-4 left-4">
          <span className="bg-white/90 backdrop-blur text-angola-black text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-sm border border-angola-black/5">
            {content.type}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-angola-red text-[10px] uppercase font-black tracking-widest">
            {content.category}
          </span>
        </div>
        <h3 className="text-xl font-black text-angola-black mb-2 line-clamp-2 leading-tight">
          {content.title}
        </h3>
        <p className="text-angola-black/50 text-sm mb-6 line-clamp-2 font-medium">
          {content.subtitle || content.author}
        </p>
        
        <Link 
          to={`/content/${content.id}`}
          className="w-full flex items-center justify-center gap-2 bg-angola-black text-white py-4 rounded-2xl font-bold hover:bg-angola-red transition-all group shadow-xl shadow-black/10"
        >
          {(content.is_free || content.isFree) ? 'Aceder Agora' : 'Desbloquear'}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
