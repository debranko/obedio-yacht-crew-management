// Shared avatar mapping for crew members across the application
// All crew members are from Interior Department only
export const crewAvatars: Record<string, string> = {
  'Maria Lopez': 'https://images.unsplash.com/photo-1581065178026-390bc4e78dad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc1OTk4NTI5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
  'Sarah Johnson': 'https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzc3dvbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzU5OTE2ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'Sophie Martin': 'https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFufGVufDF8fHx8MTc1OTkzNTM3MXww&ixlib=rb-4.1.0&q=80&w=1080',
  'Emma Wilson': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHdvbWFufGVufDF8fHx8MTc1OTk5MzI1OXww&ixlib=rb-4.1.0&q=80&w=1080',
  'Olivia Taylor': 'https://images.unsplash.com/photo-1641808895769-29e63aa2f066?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGJ1c2luZXNzd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjAwMDY3NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'David Brown': 'https://images.unsplash.com/photo-1678626667639-de9c676e8222?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYwMDA2NzM5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'Isabella Rodriguez': 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGNoZWYlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjAwMDY3NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'Charlotte Davies': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYwMDA2NzQzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'Amelia Thompson': 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGhlYWRzaG90fGVufDF8fHx8MTc2MDAwNjc0M3ww&ixlib=rb-4.1.0&q=80&w=1080',
  'Grace Williams': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MDAwNjc0M3ww&ixlib=rb-4.1.0&q=80&w=1080',
};

export function getCrewAvatar(name: string): string | undefined {
  return crewAvatars[name];
}

// Alias for consistency across components
export const getCrewAvatarUrl = getCrewAvatar;
