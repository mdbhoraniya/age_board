export type BgThemeId =
  | 'default'
  | 'midnight'
  | 'emerald'
  | 'violet'
  | 'sunset'
  | 'rose'
  | 'oled'
  | 'paper'
  | 'custom';

export type BgTheme = {
  id: BgThemeId;
  name: string;
  icon: string;
  lightClass: string;
  darkClass: string;
  previewBg: string;
  description: string;
};

export const BG_THEMES: BgTheme[] = [
  {
    id: 'default',
    name: 'Slate Gray',
    icon: '🏔️',
    lightClass: 'bg-slate-50',
    darkClass: 'dark:bg-slate-950',
    previewBg: 'linear-gradient(135deg, #f8fafc 50%, #020617 50%)',
    description: 'Clean, modern neutral slate',
  },
  {
    id: 'midnight',
    name: 'Midnight Navy',
    icon: '🌌',
    lightClass: 'bg-sky-50',
    darkClass: 'dark:bg-[#070d1e]',
    previewBg: 'linear-gradient(135deg, #f0f9ff 50%, #070d1e 50%)',
    description: 'Deep royal blue & ocean night',
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    icon: '🌲',
    lightClass: 'bg-emerald-50/70',
    darkClass: 'dark:bg-[#061811]',
    previewBg: 'linear-gradient(135deg, #ecfdf5 50%, #061811 50%)',
    description: 'Calming sage & deep pine',
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    icon: '🔮',
    lightClass: 'bg-purple-50/70',
    darkClass: 'dark:bg-[#0f0920]',
    previewBg: 'linear-gradient(135deg, #faf5ff 50%, #0f0920 50%)',
    description: 'Electric lavender & deep galaxy',
  },
  {
    id: 'sunset',
    name: 'Warm Sunset',
    icon: '🌅',
    lightClass: 'bg-amber-50/70',
    darkClass: 'dark:bg-[#1a0e05]',
    previewBg: 'linear-gradient(135deg, #fffbeb 50%, #1a0e05 50%)',
    description: 'Cozy honey gold & warm dark stone',
  },
  {
    id: 'rose',
    name: 'Rose Blush',
    icon: '🌸',
    lightClass: 'bg-rose-50/70',
    darkClass: 'dark:bg-[#190910]',
    previewBg: 'linear-gradient(135deg, #fff1f2 50%, #190910 50%)',
    description: 'Soft petal pink & rich berry noir',
  },
  {
    id: 'oled',
    name: 'OLED Pure Black',
    icon: '🖤',
    lightClass: 'bg-zinc-100',
    darkClass: 'dark:bg-black',
    previewBg: 'linear-gradient(135deg, #f4f4f5 50%, #000000 50%)',
    description: 'Deepest true black for maximum contrast',
  },
  {
    id: 'paper',
    name: 'Warm Parchment',
    icon: '📜',
    lightClass: 'bg-[#faf7f2]',
    darkClass: 'dark:bg-[#14120e]',
    previewBg: 'linear-gradient(135deg, #faf7f2 50%, #14120e 50%)',
    description: 'Gentle book paper & warm espresso',
  },
];
