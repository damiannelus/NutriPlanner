import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MoodData {
  energy: number;
  mood: string;
  context: string;
  notes?: string;
  mealId?: string;
  timestamp: number;
}

interface QuickVibeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MoodData) => void;
  mealId?: string;
}

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Satisfied', value: 'satisfied' },
  { emoji: '⚡', label: 'Productive', value: 'productive' },
  { emoji: '😴', label: 'Sluggish', value: 'sluggish' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😌', label: 'Calm', value: 'calm' },
  { emoji: '🤯', label: 'Overwhelmed', value: 'overwhelmed' },
];

const CONTEXT_OPTIONS = [
  'Post-Lunch Slump',
  'Pre-Meeting Jitters',
  'Morning Energy',
  'Evening Wind-Down',
  'Mid-Day Focus',
  'Post-Workout',
];

export default function QuickVibeOverlay({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mealId 
}: QuickVibeOverlayProps) {
  const [energy, setEnergy] = useState(5);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Reset form when overlay opens
  useEffect(() => {
    if (isOpen) {
      setEnergy(5);
      setSelectedMood('');
      setSelectedContext('');
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedMood) {
      alert('Please select a mood');
      return;
    }

    const moodData: MoodData = {
      energy,
      mood: selectedMood,
      context: selectedContext,
      notes: notes || undefined,
      mealId: mealId || undefined,
      timestamp: Date.now(),
    };

    onSubmit(moodData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Overlay Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Quick Vibe Check</h2>
                  <p className="text-sm text-emerald-50">How are you feeling?</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Energy Slider */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Energy Level: <span className="text-emerald-600 text-lg">{energy}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low (1)</span>
                  <span>High (10)</span>
                </div>
              </div>

              {/* Mood Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Mood
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`
                        p-3 rounded-xl border-2 transition-all
                        ${selectedMood === mood.value
                          ? 'border-emerald-500 bg-emerald-50 scale-105'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="text-3xl mb-1">{mood.emoji}</div>
                      <div className="text-xs font-medium text-gray-700">
                        {mood.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Context Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Context (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTEXT_OPTIONS.map((context) => (
                    <button
                      key={context}
                      onClick={() => setSelectedContext(
                        selectedContext === context ? '' : context
                      )}
                      className={`
                        px-4 py-2 rounded-full text-sm font-medium transition-all
                        ${selectedContext === context
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {context}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional thoughts..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedMood}
                className={`
                  flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all
                  ${selectedMood
                    ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-95'
                    : 'bg-gray-300 cursor-not-allowed'
                  }
                `}
              >
                Save Vibe
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
