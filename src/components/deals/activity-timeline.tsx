import { CheckCircle2, Circle, Trash2, Phone, Mail, Users, StickyNote, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleActivityCompleteAction, deleteActivityAction } from "@/server/activities";

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  NOTE: StickyNote,
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Users,
  TASK: ListTodo,
};

export function ActivityTimeline({
  dealId,
  activities,
}: {
  dealId: string;
  activities: {
    id: string;
    type: string;
    body: string;
    dueAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    createdBy: { name: string };
  }[];
}) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>;
  }

  return (
    <ul className="space-y-3">
      {activities.map((activity) => {
        const Icon = TYPE_ICON[activity.type] ?? StickyNote;
        const isTask = activity.type === "TASK";
        const overdue = isTask && !activity.completedAt && activity.dueAt && activity.dueAt < new Date();

        return (
          <li key={activity.id} className="flex items-start gap-3 rounded-md border p-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <p className="text-sm">{activity.body}</p>
              <p className="text-xs text-muted-foreground">
                {activity.createdBy.name} · {activity.createdAt.toLocaleDateString("pt-BR")}
                {activity.dueAt ? (
                  <span className={overdue ? "text-destructive" : ""}>
                    {" "}
                    · prazo {activity.dueAt.toLocaleDateString("pt-BR")}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {isTask ? (
                <form action={toggleActivityCompleteAction.bind(null, activity.id, dealId)}>
                  <Button type="submit" variant="ghost" size="icon">
                    {activity.completedAt ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </form>
              ) : null}
              <form action={deleteActivityAction.bind(null, activity.id, dealId)}>
                <Button type="submit" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
