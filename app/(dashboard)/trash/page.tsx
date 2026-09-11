import { EmailList } from '@/components/email/EmailList';

export default function TrashPage() {
  return <EmailList title="Trash" options={{ folder: 'trash' }} />;
}
