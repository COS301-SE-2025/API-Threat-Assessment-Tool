import React, { useContext } from "react";
import { ThemeContext } from "../App";
import logoBlue from "../img/logo-blue.png";
import logoWhite from "../img/logo-white.png";
import ATAT from "../img/ATAT_logo.png";

const Logo = ({ className = "", style = {}, ...props }) => {
  const { darkMode } = useContext(ThemeContext);
  const logoSrc = darkMode ? logoWhite : logoBlue;

  return (
    <a
      href="https://bitm.co.za"
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
      tabIndex={0}
      aria-label="Visit BITM website"
    >
      <img
        src={logoSrc}
        alt="BlueVision Logo"
        className={`logo-img ${className}`}
        style={{ height: 70, ...style }}
        {...props}
      />
      <img
        src={ATAT}
        alt="AT-AT Logo"
        style={{ height: 70, marginLeft: 8 }}
      />
    </a>
  );
};

export default Logo;
