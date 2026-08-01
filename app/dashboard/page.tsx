import { TodoForm } from '@/components/todo/TodoForm';
import { TodoList } from '@/components/todo/TodoList';
import { InsightsCard } from '@/components/todo/InsightsCard';
import { TaskDetailView } from '@/components/todo/TaskDetailView';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* FlowState Insights Analytics Panel */}
      <section>
        <InsightsCard />
      </section>

      {/* Task Creation Bar */}
      <section>
        <TodoForm />
      </section>

      {/* Task List Section */}
      <section className="space-y-3">
        <TodoList />
      </section>

      <TaskDetailView />
    </div>
  );
}
