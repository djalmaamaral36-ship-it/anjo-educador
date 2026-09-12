import React from 'react';
import PaxPortalDeTranquilidade from './pax/PaxPortalDeTranquilidade';

interface Props {
  studentId?: string;
  userRole?: 'professor' | 'familia';
  onChangeUserRole?: (role: 'professor' | 'familia') => void;
  activeMode?: 'aula' | 'pax';
  onChangeMode?: (mode: 'aula' | 'pax') => void;
}

export default function FamilyDashboard({
  studentId = 'enzo_alencar',
  userRole = 'familia',
  onChangeUserRole = () => {},
  activeMode = 'pax',
  onChangeMode = () => {},
}: Props) {
  return (
    <PaxPortalDeTranquilidade
      userRole={userRole}
      onChangeUserRole={onChangeUserRole}
      activeMode={activeMode}
      onChangeMode={onChangeMode}
      currentStudentId={studentId}
    />
  );
}
