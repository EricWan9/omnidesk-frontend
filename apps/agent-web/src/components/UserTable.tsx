import type { User } from "../types/user";
import UserRow from "./UserRow";

interface UserTableProps {
  users: User[];
  onToggleUser: (id: number) => void;
}

function UserTable({ users, onToggleUser }: UserTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            onToggle={onToggleUser}
          />
        ))}
      </tbody>
    </table>
  );
}

export default UserTable;