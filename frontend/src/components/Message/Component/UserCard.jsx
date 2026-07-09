import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserInitials } from "@/utils/helper";
import { Button } from "@/components/ui/button";

const UserCard = ({ user, onSelect }) => {
  return (
    <Button
      type="button"
      variant="ghost"
      className="flex w-full items-center justify-between border-b border-border px-4 py-4 text-left transition-colors hover:bg-accent"
      onClick={() => onSelect(user)}
    >
      <div className="relative mr-4 shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative mr-3">
            <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
              <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
              {getUserInitials(user?.firstName + " " + user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                user?.online ? "bg-success" : "bg-muted-foreground"
              }`}
              aria-label={user?.online ? "Online" : "Offline"}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.firstName + " " + user?.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email ?? ""}
            </p>
          </div>
        </div>
      </div>
    </Button>
  );
};

export default UserCard;
