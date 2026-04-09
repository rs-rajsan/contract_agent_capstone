import { 
  LineChart, 
  MessageSquare, 
  Search, 
  Book,
  type LucideIcon 
} from 'lucide-react';

export interface NavItem {
  id: 'intelligence' | 'chat' | 'search' | 'agents';
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

export const navItems: NavItem[] = [
  {
    id: 'intelligence',
    label: 'Analysis',
    icon: LineChart,
    color: 'blue',
    description: 'Document intelligence and extraction'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    color: 'green',
    description: 'Interactive contract interrogation'
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    color: 'teal',
    description: 'Advanced semantic search'
  },
  {
    id: 'agents',
    label: 'Docs',
    icon: Book,
    color: 'purple',
    description: 'System documentation and logs'
  }
];
