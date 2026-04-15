interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = total > 1 ? (current / (total - 1)) * 100 : 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-800">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
