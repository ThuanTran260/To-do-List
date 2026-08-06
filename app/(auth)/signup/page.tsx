import { SignupForm } from '@/components/auth/SignupForm';
import { MotionPage } from '@/components/ui/MotionPage';

export default function SignupPage() {
  return (
    <MotionPage className="w-full flex justify-center">
      <SignupForm />
    </MotionPage>
  );
}
