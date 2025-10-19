import { useDrag } from 'react-dnd';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { CrewMember } from './types';

interface CrewMemberItemProps {
  crew: CrewMember;
}

export function CrewMemberItem({ crew }: CrewMemberItemProps) {
  const isOnLeave = crew.status === 'on-leave';
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'crew-member',
    item: { crewId: crew.id },
    // Disable dragging if crew is on leave
    canDrag: !isOnLeave,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const initials = crew.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const displayName = crew.nickname || crew.name.split(' ')[0];

  return (
    <div
      ref={drag}
      className={`flex items-center gap-1.5 p-1.5 rounded border-l-[3px] border-y border-r transition-all ${
        isOnLeave 
          ? 'opacity-40 cursor-not-allowed' 
          : isDragging 
            ? 'opacity-50 cursor-grabbing' 
            : 'cursor-grab'
      }`}
      style={{
        borderLeftColor: crew.color,
        borderRightColor: 'var(--border)',
        borderTopColor: 'var(--border)',
        borderBottomColor: 'var(--border)',
        backgroundColor: `${crew.color}40`,
      }}
      title={isOnLeave ? `${crew.name} is on leave and cannot be assigned` : ''}
    >
      <Avatar className={`h-6 w-6 shrink-0 ${isOnLeave ? 'grayscale' : ''}`}>
        {crew.avatar && <AvatarImage src={crew.avatar} alt={crew.name} />}
        <AvatarFallback 
          className="text-[9px] bg-muted text-foreground"
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={`text-xs text-foreground truncate ${isOnLeave ? 'line-through' : ''}`}>
          {displayName}
        </p>
        <p className={`text-[10px] text-muted-foreground truncate leading-tight ${isOnLeave ? 'line-through' : ''}`}>
          {crew.position}
        </p>
      </div>
    </div>
  );
}
