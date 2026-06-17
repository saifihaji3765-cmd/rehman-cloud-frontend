import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <nav>

      <NavLink to="/dashboard">
        Dashboard
      </NavLink>

      <NavLink to="/workspace">
        Workspace
      </NavLink>

      <NavLink to="/deployments">
        Deployments
      </NavLink>

      <NavLink to="/billing">
        Billing
      </NavLink>

      <NavLink to="/settings">
        Settings
      </NavLink>

    </nav>
  );
}

export default Sidebar;
