import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ModalEntryForm from './ModalEntryForm';

export default function EntryFab() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-20 right-5 md:right-8 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-3xl flex items-center justify-center shadow-xl hover:scale-105 transition"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <ModalEntryForm 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}