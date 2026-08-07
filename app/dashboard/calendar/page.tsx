import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { MotionPage } from '@/components/ui/MotionPage';

export default function CalendarPage() {
  return (
    <MotionPage className="space-y-6">
      <CalendarGrid />
    </MotionPage>
  );
}
