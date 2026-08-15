'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import { Globe, Clock, ChevronDown, Sun, Moon } from 'lucide-react';

interface CityTimeZone {
  id: string;
  cityName: string;
  country: string;
  flag: string;
  timeZone: string;
}

const WORLD_CITIES: CityTimeZone[] = [
  { id: 'vn', cityName: 'Hà Nội / TP.HCM', country: 'Việt Nam', flag: '🇻🇳', timeZone: 'Asia/Ho_Chi_Minh' },
  { id: 'jp', cityName: 'Tokyo', country: 'Nhật Bản', flag: '🇯🇵', timeZone: 'Asia/Tokyo' },
  { id: 'sg', cityName: 'Singapore', country: 'Singapore', flag: '🇸🇬', timeZone: 'Asia/Singapore' },
  { id: 'uk', cityName: 'London', country: 'Anh Quốc', flag: '🇬🇧', timeZone: 'Europe/London' },
  { id: 'fr', cityName: 'Paris', country: 'Pháp', flag: '🇫🇷', timeZone: 'Europe/Paris' },
  { id: 'ny', cityName: 'New York', country: 'Hoa Kỳ (Mỹ)', flag: '🇺🇸', timeZone: 'America/New_York' },
  { id: 'la', cityName: 'Los Angeles', country: 'Hoa Kỳ (Mỹ)', flag: '🇺🇸', timeZone: 'America/Los_Angeles' },
  { id: 'syd', cityName: 'Sydney', country: 'Úc', flag: '🇦🇺', timeZone: 'Australia/Sydney' },
];

export function WorldClockWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityTimeZone>(WORLD_CITIES[0]);
  const [now, setNow] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update ticking clock every 1 second
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format time for a specific timeZone
  const formatCityTime = (date: Date, timeZone: string) => {
    return date.toLocaleTimeString('vi-VN', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatCityDate = (date: Date, timeZone: string) => {
    const formatted = date.toLocaleDateString('vi-VN', {
      timeZone,
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const isDaytime = (date: Date, timeZone: string) => {
    const hour = parseInt(
      date.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', hour12: false }),
      10
    );
    return hour >= 6 && hour < 18;
  };

  if (!now) {
    return (
      <div className="hidden sm:block animate-pulse">
        <div className="h-3 w-16 bg-surface-2 rounded mb-1" />
        <div className="h-4 w-32 bg-surface-2 rounded" />
      </div>
    );
  }

  const activeTimeStr = formatCityTime(now, selectedCity.timeZone);
  const activeDateStr = formatCityDate(now, selectedCity.timeZone);
  const activeIsDay = isDaytime(now, selectedCity.timeZone);

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-2 border border-hairline transition-colors text-left cursor-pointer"
        title="Bấm để xem giờ thế giới"
      >
        <div className="w-7 h-7 rounded-md bg-primary-subtle text-primary flex items-center justify-center flex-shrink-0 border border-primary-border">
          <Globe className="w-3.5 h-3.5" />
        </div>

        <div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              {selectedCity.flag} {selectedCity.cityName}
            </span>
            {activeIsDay ? (
              <Sun className="w-3 h-3 text-warning" />
            ) : (
              <Moon className="w-3 h-3 text-primary" />
            )}
            <ChevronDown className={`w-3 h-3 text-ink-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-ink font-mono tracking-tight">
              {activeTimeStr}
            </span>
            <span className="text-[11px] font-normal text-ink-subtle">
              ({activeDateStr})
            </span>
          </div>
        </div>
      </button>

      {/* Popover Grid of World Cities */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={springPillMotion}
            className="absolute left-0 top-full mt-2 w-80 sm:w-96 p-3.5 rounded-xl surface-panel bg-surface-1 border border-hairline shadow-2xl z-50 space-y-2.5 text-ink"
          >
            <div className="flex items-center justify-between pb-2 border-b border-hairline">
              <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Giờ thế giới thời gian thực (World Clock)</span>
              </h4>
              <span className="text-[10px] font-medium text-ink-subtle">Live 1s</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
              {WORLD_CITIES.map((city) => {
                const cityTime = formatCityTime(now, city.timeZone);
                const cityDate = formatCityDate(now, city.timeZone);
                const cityIsDay = isDaytime(now, city.timeZone);
                const isSelected = selectedCity.id === city.id;

                return (
                  <button
                    key={city.id}
                    onClick={() => {
                      setSelectedCity(city);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-lg text-left border transition-colors cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface-2 border-hairline text-ink hover:border-hairline-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate">
                        {city.flag} {city.cityName}
                      </span>
                      {cityIsDay ? (
                        <Sun className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-warning'}`} />
                      ) : (
                        <Moon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-primary'}`} />
                      )}
                    </div>

                    <div className="mt-1 flex items-baseline justify-between">
                      <span
                        className={`text-xs font-semibold font-mono tracking-tight ${
                          isSelected ? 'text-white' : 'text-ink'
                        }`}
                      >
                        {cityTime}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? 'text-white/80' : 'text-ink-subtle'
                        }`}
                      >
                        {cityDate.split(',')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
