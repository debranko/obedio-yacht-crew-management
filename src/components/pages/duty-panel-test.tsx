/**
 * Test page for the new DutyPanel (widgetDuty3)
 * Navigate to this page to see the widget in action
 */

import DutyPanelDemo from "../widgetDuty3";

export function DutyPanelTestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Duty Panel Widget (widgetDuty3) - Test</h1>
      <p className="text-sm text-muted-foreground mb-6">
        This is a live preview of the new duty panel widget with real-time countdown.
      </p>
      
      {/* Demo component with live countdown */}
      <DutyPanelDemo />
      
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">Features:</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>✅ 3-column layout (Currently on duty | Countdown Ring | Next on duty)</li>
          <li>✅ Segmented tick countdown ring (72 ticks, 5° spacing)</li>
          <li>✅ Real-time countdown (updates every second)</li>
          <li>✅ Backup crew lists (left & right columns)</li>
          <li>✅ "Call Backup" button functionality</li>
          <li>✅ Gradient background (amber → cyan)</li>
          <li>✅ Clean, luxury minimalist design</li>
        </ul>
      </div>
    </div>
  );
}

export default DutyPanelTestPage;
