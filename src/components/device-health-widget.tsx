/**
 * Device Health Widget
 * Shows real-time status of all devices on the yacht
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Activity, Battery, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  lowBattery: number;
  weakSignal: number;
}

export function DeviceHealthWidget() {
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.devices.getAll(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate statistics
  const stats: DeviceStats = {
    total: devices.length,
    online: devices.filter((d: any) => d.status === 'online').length,
    offline: devices.filter((d: any) => d.status === 'offline').length,
    lowBattery: devices.filter((d: any) => d.batteryLevel && d.batteryLevel < 20).length,
    weakSignal: devices.filter((d: any) => d.signalStrength && d.signalStrength < -80).length,
  };

  const healthPercentage = stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0;
  const healthColor = healthPercentage >= 80 ? 'text-green-500' : healthPercentage >= 60 ? 'text-yellow-500' : 'text-red-500';

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Device Health</h3>
          <p className="text-sm text-gray-500">Real-time system status</p>
        </div>
        <Activity className="h-5 w-5 text-gray-400" />
      </div>

      {/* Overall Health */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">System Health</span>
          <span className={`text-2xl font-bold ${healthColor}`}>{healthPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              healthPercentage >= 80 ? 'bg-green-500' : healthPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
      </div>

      {/* Device Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Online Devices */}
        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <Wifi className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-2xl font-bold text-green-700">{stats.online}</p>
            <p className="text-xs text-green-600">Online</p>
          </div>
        </div>

        {/* Offline Devices */}
        <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
          stats.offline > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <WifiOff className={`h-5 w-5 ${stats.offline > 0 ? 'text-red-600' : 'text-gray-400'}`} />
          <div>
            <p className={`text-2xl font-bold ${stats.offline > 0 ? 'text-red-700' : 'text-gray-500'}`}>
              {stats.offline}
            </p>
            <p className={`text-xs ${stats.offline > 0 ? 'text-red-600' : 'text-gray-500'}`}>Offline</p>
          </div>
        </div>

        {/* Low Battery */}
        <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
          stats.lowBattery > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <Battery className={`h-5 w-5 ${stats.lowBattery > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
          <div>
            <p className={`text-2xl font-bold ${stats.lowBattery > 0 ? 'text-yellow-700' : 'text-gray-500'}`}>
              {stats.lowBattery}
            </p>
            <p className={`text-xs ${stats.lowBattery > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>Low Battery</p>
          </div>
        </div>

        {/* Weak Signal */}
        <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
          stats.weakSignal > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <AlertTriangle className={`h-5 w-5 ${stats.weakSignal > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
          <div>
            <p className={`text-2xl font-bold ${stats.weakSignal > 0 ? 'text-orange-700' : 'text-gray-500'}`}>
              {stats.weakSignal}
            </p>
            <p className={`text-xs ${stats.weakSignal > 0 ? 'text-orange-600' : 'text-gray-500'}`}>Weak Signal</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.offline > 0 || stats.lowBattery > 0 || stats.weakSignal > 0) && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-800 mb-1">Action Required</p>
          <ul className="text-xs text-amber-700 space-y-1">
            {stats.offline > 0 && <li>• {stats.offline} device(s) offline - check connectivity</li>}
            {stats.lowBattery > 0 && <li>• {stats.lowBattery} device(s) need charging</li>}
            {stats.weakSignal > 0 && <li>• {stats.weakSignal} device(s) have weak signal</li>}
          </ul>
        </div>
      )}

      {/* Quick Action */}
      <div className="mt-4">
        <a
          href="/device-manager"
          className="block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
        >
          View All Devices →
        </a>
      </div>
    </div>
  );
}
