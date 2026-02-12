import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MoodEntry {
  id: string;
  user_id: string;
  energy: number;
  mood: string;
  context: string[];
  notes: string;
  meal_id: string | null;
  timestamp: string;
  created_at: string;
}

export function useMoodTracking(userId: string | undefined, days: number = 7) {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    const fetchMoodEntries = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range (last N days)
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);

        const moodQuery = query(
          collection(db, 'mood_tracking'),
          where('user_id', '==', userId),
          where('timestamp', '>=', daysAgo.toISOString()),
          orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(moodQuery);
        const entries: MoodEntry[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MoodEntry));

        console.log(`Loaded ${entries.length} mood entries for last ${days} days`);
        setMoodEntries(entries);
      } catch (err) {
        console.error('Error fetching mood entries:', err);
        setError(err instanceof Error ? err.message : 'Failed to load mood data');
      } finally {
        setLoading(false);
      }
    };

    fetchMoodEntries();
  }, [userId, days]);

  // Calculate statistics
  const stats = {
    averageEnergy: moodEntries.length > 0
      ? moodEntries.reduce((sum, entry) => sum + entry.energy, 0) / moodEntries.length
      : 0,
    totalEntries: moodEntries.length,
    moodDistribution: moodEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return {
    moodEntries,
    loading,
    error,
    stats
  };
}
