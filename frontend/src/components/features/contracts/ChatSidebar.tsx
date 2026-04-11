import { 
    Plus, 
    Search, 
    Settings2, 
    FileCode2, 
    History,
    Activity
} from "lucide-react";

interface ChatHistorySidebarProps {
    onNewChat: () => void;
}

export function ChatHistorySidebar({ onNewChat }: ChatHistorySidebarProps) {
    const recents = [
        { id: "1", title: "SOW contract relationship audit", date: "2h ago" },
        { id: "2", title: "Monetary value extraction - Q4", date: "5h ago" },
        { id: "3", title: "Party identification for active deals", date: "Yesterday" },
        { id: "4", title: "Risk score comparison for vendor...", date: "Apr 10" }
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/30 border-r border-slate-200/60 dark:border-slate-800/60 w-64 shrink-0 overflow-hidden animate-in slide-in-from-left duration-500">
            {/* Action Header */}
            <div className="p-4 space-y-4">
                <button 
                    onClick={onNewChat}
                    className="w-full flex items-center gap-3 px-3 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-xl transition-all group"
                >
                    <Plus className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold tracking-tight">New chat</span>
                </button>

                <div className="space-y-1">
                    <NavItem icon={Search} label="Search history" />
                    <NavItem icon={Settings2} label="Customize Aequitas" />
                    <NavItem icon={FileCode2} label="Artifacts" />
                </div>
            </div>

            {/* Recents Section */}
            <div className="flex-1 overflow-y-auto px-2 py-4 border-t border-slate-200/40 dark:border-slate-800/40">
                <div className="flex items-center gap-2 px-3 mb-4 opacity-40">
                    <History className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Recents</span>
                </div>

                <div className="space-y-0.5">
                    {recents.map((item) => (
                        <button 
                            key={item.id}
                            className="w-full flex flex-col gap-0.5 px-3 py-3 text-left rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {item.title}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                                {item.date}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
}

function NavItem({ icon: Icon, label }: { icon: any, label: string }) {
    return (
        <button className="w-full flex items-center gap-3 px-3 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-xl transition-all group">
            <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold tracking-tight">{label}</span>
        </button>
    );
}
