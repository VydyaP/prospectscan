import { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import CompanyReportContent from './components/CompanyReportContent';

export default function CompanyReportPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-8 text-center">Loading report…</div>}>
        <CompanyReportContent />
      </Suspense>
    </AppLayout>
  );
}