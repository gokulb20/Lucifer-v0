import { FC } from "react";
import Link from "next/link";
import { IconMoon, IconSun, IconSettings } from "@tabler/icons-react";

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: FC<NavbarProps> = ({ darkMode, onToggleDarkMode }) => {
  return (
    <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 dark:border-neutral-700 py-2 px-2 sm:px-8 items-center justify-between bg-white dark:bg-neutral-900">
      <div className="font-bold text-3xl flex items-center text-neutral-900 dark:text-white">
        <span className="ml-2">Lucifer</span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Settings"
        >
          <IconSettings className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
        </Link>
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <IconSun className="h-6 w-6 text-yellow-500" />
          ) : (
            <IconMoon className="h-6 w-6 text-neutral-600" />
          )}
        </button>
      </div>
    </div>
  );
};
