import { LoginForm } from '@/components/auth/LoginForm';
import { MotionPage } from '@/components/ui/MotionPage';

export default function LoginPage() {
  return (
    <MotionPage className="w-full flex justify-center">
      <LoginForm />
    </MotionPage>
  );
}
