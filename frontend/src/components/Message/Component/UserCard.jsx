import { getUserInitials } from "@/utils/helper";
const UserCard = ({ user, onSelect }) => {
  return (
    <div
      className="flex items-center justify-between w-full p-4 border-b border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer"
      onClick={() => onSelect(user)}
    >
      <div className="flex-shrink-0 mr-4 relative">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)] flex items-center justify-center mr-3">
            <span className="text-sm font-bold text-[var(--secondary)]">
              {getUserInitials(user?.firstName + " " + user?.lastName)}
            </span>
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                user?.online ? "bg-green-500" : "bg-gray-400"
              }`}
              aria-label={user?.online ? "Online" : "Offline"}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--secondary)] truncate">
              {user?.firstName + " " + user?.lastName}
            </p>
            <p className="text-xs text-[var(--secondary)] truncate">
              {user?.email ?? ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
