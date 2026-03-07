import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColorPickerPopoverProps {
    color: string;
    onChange: (color: string) => void;
    palettes: any[];
    children: React.ReactNode;
}

export function ColorPickerPopover({ color, onChange, palettes, children }: ColorPickerPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" sideOffset={8}>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {/* Predefined Palettes */}
                    {palettes.map(palette => {
                        const colors = typeof palette.colors === 'string' ? JSON.parse(palette.colors) : palette.colors;
                        return (
                            <div key={palette.id} className="space-y-1.5">
                                <span className="text-xs font-medium text-neutral-500">{palette.name}</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {colors.map((c: string, i: number) => (
                                        <button
                                            key={`${palette.id}-${i}`}
                                            className={`w-6 h-6 rounded-md border shadow-sm transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-black/10'}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => onChange(c)}
                                            title={c}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    <div className="border-t pt-3">
                        <span className="text-xs font-medium text-neutral-500 block mb-2">Custom Color</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={color || '#000000'}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                            />
                            <input
                                type="text"
                                value={color || '#000000'}
                                onChange={(e) => onChange(e.target.value)}
                                className="flex-1 text-sm border rounded px-2 py-1 font-mono uppercase"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
