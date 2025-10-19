import { DeviceLog, CallLog, RecentActivity } from '../types';

export function generateMockDeviceLogs(): DeviceLog[] {
  const devices = [
    { name: 'Main Bridge Tablet', location: 'Bridge' },
    { name: 'Main Salon Display', location: 'Main Salon' },
    { name: 'Conference Room Monitor', location: 'Conference Room' },
    { name: 'Owner\'s Stateroom Panel', location: 'Owner\'s Stateroom' },
    { name: 'VIP Cabin Tablet', location: 'VIP Cabin' },
    { name: 'Dining Room Display', location: 'Dining Room' },
  ];

  const statuses: Array<'online' | 'offline' | 'alert' | 'maintenance'> = 
    ['online', 'offline', 'alert', 'maintenance'];
  
  const messages = {
    online: ['Device connected successfully', 'System operational', 'Ready for use'],
    offline: ['Connection lost', 'Device disconnected', 'Network timeout'],
    alert: ['Low battery warning', 'Temperature alert', 'Unusual activity detected'],
    maintenance: ['Scheduled maintenance started', 'Firmware update in progress', 'System check initiated'],
  };

  const logs: DeviceLog[] = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const messageList = messages[status];
    const message = messageList[Math.floor(Math.random() * messageList.length)];
    
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    logs.push({
      id: `device-${i}`,
      timestamp,
      device: device.name,
      location: device.location,
      status,
      message,
      user: status === 'maintenance' ? 'System Admin' : undefined,
    });
  }

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function generateMockCallLogs(): CallLog[] {
  const crew = [
    'Maria Lopez',
    'Sarah Johnson',
    'Sophie Martin',
    'Emma Wilson',
    'Olivia Taylor',
    'David Brown',
    'Isabella Rodriguez',
    'Charlotte Davies',
    'Amelia Thompson',
    'Grace Williams',
  ];

  const locations = ['Bridge', 'Owner\'s Stateroom', 'Main Deck', 'Conference Room', 'VIP Cabin', 'Main Salon'];
  const types: Array<'internal' | 'external' | 'emergency'> = ['internal', 'internal', 'internal', 'external', 'emergency'];
  const statuses: Array<'completed' | 'missed' | 'ongoing'> = ['completed', 'completed', 'completed', 'missed'];

  const logs: CallLog[] = [];
  const now = new Date();

  for (let i = 0; i < 40; i++) {
    const caller = crew[Math.floor(Math.random() * crew.length)];
    let recipient = crew[Math.floor(Math.random() * crew.length)];
    while (recipient === caller) {
      recipient = crew[Math.floor(Math.random() * crew.length)];
    }

    const type = types[Math.floor(Math.random() * types.length)];
    const status = type === 'emergency' ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)];
    const duration = status === 'completed' ? Math.floor(Math.random() * 600) + 30 : 0;
    
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    logs.push({
      id: `call-${i}`,
      timestamp,
      caller,
      recipient: type === 'external' ? 'Marina Office' : recipient,
      location: locations[Math.floor(Math.random() * locations.length)],
      duration,
      type,
      status,
    });
  }

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function generateMockRecentActivity(): RecentActivity[] {
  const guests = [
    'Mr. Anderson',
    'Mrs. Chen',
    'Dr. Williams',
    'Ms. Taylor',
    'Mr. Blackwood',
    'Ms. Rodriguez',
  ];

  const crew = [
    'Maria Lopez',
    'Sarah Johnson',
    'Sophie Martin',
    'Emma Wilson',
    'Olivia Taylor',
  ];

  const requests = [
    'Champagne to sun deck',
    'Cabin temperature adjustment',
    'Dinner reservations',
    'Beach club setup',
    'Fresh towels delivery',
    'Breakfast service',
    'Wine selection',
    'Spa appointment',
    'Water sports equipment',
    'Evening turndown service',
  ];

  const statuses: Array<'completed' | 'in-progress'> = ['completed', 'completed', 'completed', 'in-progress'];
  
  const activities: RecentActivity[] = [];
  const now = new Date();

  for (let i = 0; i < 10; i++) {
    const minutesAgo = Math.floor(Math.random() * 120) + 1;
    const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    let timeDisplay: string;
    if (minutesAgo < 60) {
      timeDisplay = `${minutesAgo} min ago`;
    } else {
      const hoursAgo = Math.floor(minutesAgo / 60);
      timeDisplay = `${hoursAgo}h ago`;
    }

    activities.push({
      id: i + 1,
      guest: guests[Math.floor(Math.random() * guests.length)],
      request: requests[Math.floor(Math.random() * requests.length)],
      crew: crew[Math.floor(Math.random() * crew.length)],
      time: timeDisplay,
      status,
      timestamp,
    });
  }

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4);
}