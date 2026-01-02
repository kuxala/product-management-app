interface StatCardProps {
  value: number;
  label: string;
  color: 'indigo' | 'green' | 'purple' | 'blue' | 'red' | 'yellow';
}

const colorClasses = {
  indigo: 'text-indigo-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  blue: 'text-blue-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
};

export function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}

interface QuickStatsProps {
  stats: Array<{
    value: number;
    label: string;
    color: StatCardProps['color'];
  }>;
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
