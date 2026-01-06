import { FC } from "react";

interface Props {
  onReset: () => void;
}

export const ResetChat: FC<Props> = ({ onReset }) => {
  return (
    <div className="flex flex-row items-center">
      <button
        className="text-sm sm:text-base text-neutral-900 dark:text-white font-semibold rounded-lg px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
        onClick={() => onReset()}
      >
        Reset
      </button>
    </div>
  );
};
;