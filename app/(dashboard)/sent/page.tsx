import { EmailList } from '@/components/email/EmailList';

export default function SentPage() {
  return <EmailList title="Sent" options={{ folder: 'sent' }} />;
}
