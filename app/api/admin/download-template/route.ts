import { NextResponse } from 'next/server';

export async function GET() {
  const template = 'email,full_name\njohn@example.com,John Doe\n';
  
  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="import_template.csv"'
    }
  });
}
