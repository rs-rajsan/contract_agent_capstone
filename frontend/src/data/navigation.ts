import { 
  LineChart, 
  MessageSquare, 
  Search, 
  Book,
  Brain,
  type LucideIcon 
} from 'lucide-react';

export interface NavItem {
  id: 'intelligence' | 'chat' | 'search' | 'agents' | 'analytics';
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

export const navItems: NavItem[] = [
  {
    id: 'analytics',
    label: 'Auditor',
    icon: LineChart, 
    color: 'purple',
    description: 'Autonomous accountability and system health'
  },
  {
    id: 'intelligence',
    label: 'Analysis',
    icon: Brain, 
    color: 'blue',
    description: 'Advanced contract analysis engine'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    color: 'green',
    description: 'Direct dialogue with Aequitas'
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    color: 'teal',
    description: 'Advanced semantic exploration'
  },
  {
    id: 'agents',
    label: 'Docs',
    icon: Book,
    color: 'purple',
    description: 'Knowledge base and system logs'
  }
];
