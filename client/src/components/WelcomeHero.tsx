import { cn } from '@/lib/utils';
import AvatarUpload from './AvatarUpload';

export default function WelcomeHero({ user, streak = 0 }) {
  return (
    <section
      className="
        w-full rounded-3xl overflow-hidden
        bg-gradient-to-r from-purple-500/90 to-blue-500/90
        text-white shadow-lg
        p-8 md:p-12
        flex flex-col md:flex-row items-center
        gap-6"
    >
      {/* левый блок — приветствие */}
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
          Вітаю, {user?.firstName || 'Друже'}! 👋
        </h1>
        <p className="text-sm md:text-base opacity-90">
          Сьогодні твій&nbsp;
          <span className="font-medium">{streak}</span>&nbsp;
          день без пропусків&nbsp;&mdash; продовжуй у тому ж дусі!
        </p>
      </div>

      {/* правый — иконка/аватар */}
      <div className="
          h-20 w-20 md:h-24 md:w-24
          rounded-full bg-white/20
          flex items-center justify-center text-4xl md:text-5xl overflow-hidden">
        <AvatarUpload user={user} />
      </div>
    </section>
  );
}