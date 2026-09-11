import { EmailList } from '@/components/email/EmailList';

export default function DraftsPage() {
  return <EmailList title="Drafts" options={{ folder: 'drafts' }} />;
}
