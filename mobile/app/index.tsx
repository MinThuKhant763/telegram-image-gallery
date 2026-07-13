import { useAuth } from '@/src/auth/auth-provider';
import { Redirect } from 'expo-router';

export default function Index() {
  const { session } = useAuth();
  return <Redirect href={session ? '/gallery' : '/sign-in'} />;
}
