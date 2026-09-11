import { EmailList } from '@/components/email/EmailList';

export default function InboxPage() {
  return <EmailList title="Inbox" options={{ folder: 'inbox' }} />;
}
