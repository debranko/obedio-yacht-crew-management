import { CrewMember } from './duty-roster/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  MessageSquare,
  Edit,
  Trash2,
  Mail,
  Phone,
  Radio,
  Power
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { getStatusBadge } from '../utils/crew-utils';

interface CrewCardViewProps {
  crew: CrewMember;
  isOnDuty: boolean;
  nextShift?: { shift: string };
  onToggleDuty: (crew: CrewMember) => void;
  onMessage: (crew: CrewMember) => void;
  onEdit: (crew: CrewMember) => void;
  onDelete: (crew: CrewMember) => void;
  onClick: (crew: CrewMember) => void;
}

export function CrewCardView({
  crew,
  isOnDuty,
  nextShift,
  onToggleDuty,
  onMessage,
  onEdit,
  onDelete,
  onClick,
}: CrewCardViewProps) {
  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onClick(crew)}
    >
      <div className="flex items-start gap-4">
        {/* Avatar & Toggle */}
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-12 w-12">
            <AvatarImage src={crew.avatar} />
            <AvatarFallback
              className="text-white text-sm"
              style={{ backgroundColor: crew.color }}
            >
              {crew.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          
          {/* Status Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDuty(crew);
            }}
            disabled={crew.status === 'on-leave'}
            className={`
              relative inline-flex h-5 w-9 items-center rounded-full transition-colors
              ${crew.status === 'on-leave' 
                ? 'bg-muted/50 cursor-not-allowed' 
                : isOnDuty 
                  ? 'bg-success' 
                  : 'bg-input'
              }
              ${crew.status === 'on-leave' ? 'opacity-50' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
                ${isOnDuty ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="truncate mb-1">{crew.name}</h4>
              {crew.nickname && (
                <p className="text-sm text-muted-foreground truncate mb-1">
                  "{crew.nickname}"
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {crew.position}
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {getStatusBadge(crew.status)}
              {crew.status === 'on-leave' && crew.leaveStart && crew.leaveEnd && (
                <span className="text-[10px] text-muted-foreground text-right">
                  {new Date(crew.leaveStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(crew.leaveEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-1 mb-3">
            {crew.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{crew.email}</span>
              </div>
            )}
            {crew.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{crew.phone}</span>
              </div>
            )}
            {crew.onBoardContact && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Radio className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{crew.onBoardContact}</span>
              </div>
            )}
          </div>

          {/* Current Status/Shift */}
          {isOnDuty && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-success/10 rounded-lg">
              <Power className="h-3.5 w-3.5 text-success flex-shrink-0" />
              <span className="text-sm text-success">Currently on duty</span>
            </div>
          )}
          {!isOnDuty && nextShift && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">
                Next: {nextShift.shift}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessage(crew);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send Message</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(crew);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(crew);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Card>
  );
}
