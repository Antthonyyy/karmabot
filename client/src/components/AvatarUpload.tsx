import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { authUtils } from '@/utils/auth';
import { apiRequest } from '@/lib/queryClient';

interface AvatarUploadProps {
  user: any;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarUpload({ user, size = 'md' }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const sizeClasses = {
    sm: 'h-12 w-12 text-sm',
    md: 'h-20 w-20 md:h-24 md:w-24 text-2xl md:text-3xl',
    lg: 'h-32 w-32 text-4xl'
  };

  // Защита от null user
  if (!user) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse`} />
    );
  }

  const getInitials = () => {
    if (!user?.firstName) return '?';
    const firstInitial = user.firstName.charAt(0).toUpperCase();
    const lastInitial = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка размера файла (5 MB)
    if (file.size > 5_000_000) {
      alert('Файл слишком большой. Максимальный размер: 5 МБ');
      return;
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiRequest('/api/user/avatar', { method: 'POST' });

      if (!response.ok) {
        throw new Error('Ошибка загрузки');
      }

      const data = await response.json();
      
      // Обновляем кеш пользователя
      queryClient.setQueryData(['/api/user/me'], (oldData: any) => ({
        ...oldData,
        profilePicture: data.profilePicture + '?v=' + Date.now()
      }));

    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      alert('Ошибка загрузки изображения');
    } finally {
      setIsUploading(false);
      // Очищаем input для возможности повторной загрузки того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div 
      className={`${sizeClasses[size]} relative rounded-full cursor-pointer overflow-hidden group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => fileInputRef.current?.click()}
    >
      {user.profilePicture ? (
        <img
          src={user.profilePicture}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
          {getInitials()}
        </div>
      )}
      
      {/* Overlay при hover */}
      {(isHovered || isUploading) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          {isUploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      )}

      {/* Скрытый input для выбора файла */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}