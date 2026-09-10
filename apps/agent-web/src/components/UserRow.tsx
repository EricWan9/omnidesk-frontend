import type { User } from "../types/user";

interface UserRowProps {
  user: User;
  onToggle: (id: number) => void;
}

function UserRow({ user, onToggle }: UserRowProps) {
  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>{user.active ? "Active" : "Disabled"}</td>

      <td>
        <button
          onClick={() => onToggle(user.id)}
        >
          {user.active ? "Disable" : "Enable"}
        </button>
      </td>
    </tr>
  );
}

export default UserRow;