'use client';

import SubsidiaryDashboard from '@/components/SubsidiaryDashboard';
import { useParams } from 'next/navigation';

export default function SubsidiaryPage() {
  const params = useParams();
  
  return (
    <SubsidiaryDashboard subsidiaryId={params.id} />
  );
}
