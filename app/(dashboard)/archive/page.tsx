import { EmailList } from '@/components/email/EmailList';

export default function ArchivePage() {
  return <EmailList title="Archive" options={{ folder: 'archive' }} />;
}
