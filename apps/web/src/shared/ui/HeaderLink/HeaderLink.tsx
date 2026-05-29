import { NavLink, type NavLinkProps as RouterNavLinkProps } from "react-router";
//Стили:
import styles from "./HeaderLink.module.scss";

interface HeaderLinkProps extends RouterNavLinkProps {
  children: React.ReactNode;
}

export const HeaderLink = ({ to, children, end, ...props }: HeaderLinkProps) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => (isActive ? styles.activeLink : "")}
      {...props}
    >
      {children}
    </NavLink>
  );
};