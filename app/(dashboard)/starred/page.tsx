import { EmailList } from '@/components/email/EmailList';

export default function StarredPage() {
  return <EmailList title="Starred" options={{ starred: true }} />;
}
