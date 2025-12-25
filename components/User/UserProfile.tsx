import React, { useState, useEffect, useRef } from 'react';
import { User, Camera } from 'lucide-react';

export const UserProfile: React.FC = () => {
    const [avatar, setAvatar] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedAvatar = localStorage.getItem('zuno_user_avatar');
        if (savedAvatar) {
            setAvatar(savedAvatar);
        }
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAvatar(base64String);
                localStorage.setItem('zuno_user_avatar', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex items-center gap-3 px-2 py-2 mb-6 group cursor-pointer" onClick={triggerUpload}>
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-zuno-accent transition-all ring-2 ring-white/10 group-hover:ring-zuno-accent/20">
                {avatar ? (
                    <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-zuno-card flex items-center justify-center">
                        <User size={20} className="text-zuno-muted" />
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={16} className="text-white" />
                </div>
            </div>

            <div className="flex flex-col">
                <span className="text-sm font-bold text-white group-hover:text-zuno-accent transition-colors">Meu Perfil</span>
                <span className="text-[10px] text-zuno-muted uppercase tracking-wider">Editar foto</span>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
            />
        </div>
    );
};
