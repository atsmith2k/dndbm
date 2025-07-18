'use client';

import React from 'react';
import BattleMapEditor from '@/components/battle-map/BattleMapEditor';

interface EditorPageProps {
  params: {
    id: string;
  };
}

export default function EditMapPage({ params }: EditorPageProps) {
  return <BattleMapEditor mapId={params.id} />;
}
