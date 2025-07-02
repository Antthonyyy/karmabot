
import { Logo } from '@/components/Logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface WelcomeHeroProps {
  user: any;
  streak?: number;
  openModal: () => void;
}

export default function WelcomeHero({ user, streak = 0, openModal }: WelcomeHeroProps) {
  const first = user?.firstName ?? 'Друже'
  return (
    <section
      className="h-32 md:h-40 rounded-3xl
                 bg-gradient-to-r from-purple-500 to-blue-500 text-white
                 px-6 md:px-10 grid grid-cols-[auto_1fr] gap-6 items-center shadow-lg">
      {/* Логотип-лотос */}
      <div className="h-16 w-16 md:h-20 md:w-20 flex items-center justify-center">
        <Logo className="h-full w-full text-white/90" />
      </div>

      <div>
        <h1 className="text-xl md:text-2xl font-semibold">
          Вітаю, {first}! 👋
        </h1>
        <p className="text-sm opacity-90 mt-1">
          {streak
            ? <>Сьогодні твій <b>{streak}</b> день без пропусків — продовжуй!</>
            : 'Почни серію сьогодні 🚀'}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Badge variant="secondary">🔥 {streak} днів</Badge>
          <Button size="sm" onClick={openModal}>+ Запис</Button>
        </div>
      </div>
    </section>
  )
}
