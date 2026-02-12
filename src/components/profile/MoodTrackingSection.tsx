import { format, parseISO } from 'date-fns';
import { useMoodTracking } from '../../hooks/useMoodTracking';
import { Card } from '../ui/Card';
import { Activity, TrendingUp, Calendar } from 'lucide-react';

interface MoodTrackingSectionProps {
  userId: string;
}

export function MoodTrackingSection({ userId }: MoodTrackingSectionProps) {
  const { moodEntries, loading, error, stats } = useMoodTracking(userId, 7);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading mood data: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-900">Mood Tracking</h2>
        </div>
        <span className="text-sm text-gray-500">Last 7 days</span>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Average Energy */}
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-900">Avg Energy</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {stats.averageEnergy > 0 ? stats.averageEnergy.toFixed(1) : '—'}/10
          </p>
        </div>

        {/* Total Entries */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Entries</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.totalEntries}</p>
        </div>

        {/* Most Common Mood */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-purple-900">Top Mood</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {Object.entries(stats.moodDistribution).length > 0
              ? Object.entries(stats.moodDistribution).sort(([, a], [, b]) => b - a)[0][0]
              : '—'}
          </p>
        </div>
      </div>

      {/* Mood Entries Timeline */}
      {moodEntries.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Entries</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {moodEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                {/* Mood Emoji */}
                <div className="text-2xl flex-shrink-0">{entry.mood}</div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      Energy: {entry.energy}/10
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(parseISO(entry.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  
                  {/* Context Tags */}
                  {entry.context && entry.context.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {entry.context.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Notes */}
                  {entry.notes && (
                    <p className="text-sm text-gray-600 line-clamp-2">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No mood entries yet</p>
          <p className="text-sm">
            Start tracking your mood after meals to see insights here!
          </p>
        </div>
      )}
    </Card>
  );
}
