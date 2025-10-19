import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { CrewListPage } from './crew-list';
import { DutyRosterTab } from './duty-roster-tab';

interface CrewManagementPageProps {
  onNavigate?: (page: string) => void;
  onNavigateToSettingsRoles?: () => void;
}

export function CrewManagementPage({ onNavigate, onNavigateToSettingsRoles }: CrewManagementPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'duty-roster'>('overview');

  return (
    <div className="space-y-6">
      {/* Tabs - Prominent and Visible */}
      <div className="border-b border-border">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'duty-roster')}>
          <TabsList className="h-12">
            <TabsTrigger value="overview" className="px-6">
              Overview
            </TabsTrigger>
            <TabsTrigger value="duty-roster" className="px-6">
              Duty Roster
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <CrewListPage 
          onNavigate={onNavigate} 
          onNavigateToSettingsRoles={onNavigateToSettingsRoles} 
        />
      )}
      
      {activeTab === 'duty-roster' && (
        <DutyRosterTab />
      )}
    </div>
  );
}
