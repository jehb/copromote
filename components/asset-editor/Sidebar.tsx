import React from 'react';
import { Type, Square, Image as ImageIcon, LayoutTemplate, Layers, Palette, MousePointer2 } from 'lucide-react';
import { SidebarTab } from './types';

interface SidebarProps {
    activeTab: SidebarTab | null;
    setActiveTab: (tab: SidebarTab | null) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const tabs: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
        { id: 'templates', icon: <LayoutTemplate size={20} />, label: 'Templates' },
        { id: 'text', icon: <Type size={20} />, label: 'Text' },
        { id: 'shapes', icon: <Square size={20} />, label: 'Shapes' },
        { id: 'uploads', icon: <ImageIcon size={20} />, label: 'Upload' },
        { id: 'background', icon: <Palette size={20} />, label: 'Background' },
        { id: 'layers', icon: <Layers size={20} />, label: 'Layers' },
        { id: 'resize', icon: <MousePointer2 size={20} />, label: 'Resize' },
    ];

    return (
        <div className="w-[72px] bg-white border-r h-full flex flex-col items-center py-4 gap-2 z-20 shadow-sm flex-shrink-0">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                    className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors
                        ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}
                    `}
                    title={tab.label}
                >
                    {tab.icon}
                    <span className="text-[9px] font-medium">{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
