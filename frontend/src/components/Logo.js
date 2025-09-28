import React, { useContext } from "react";
import { ThemeContext } from "../App";
import logoBlue from "../img/logo-blue.png";
import logoWhite from "../img/logo-white.png";
import ATAT from "../img/YESSSS.png";

const Logo = ({ className = "", style = {}, ...props }) => {
  const { darkMode } = useContext(ThemeContext);
  const logoSrc = darkMode ? logoWhite : logoBlue;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {/* BlueVision logo */}
      <a
        href="https://bitm.co.za"
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={0}
        aria-label="Visit BITM website"
        style={{ display: "flex", alignItems: "center" }}
      >
        <img
          src={logoSrc}
          alt="BlueVision Logo"
          className={`logo-img ${className}`}
          style={{ height: 70, ...style }}
          {...props}
        />
      </a>

      {}
      <a
        href="http://apithreatassessment.co.za/"
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={0}
        aria-label="Visit AT-AT project repository"
        style={{ display: "flex", alignItems: "center", marginLeft: 8 }}
      >
        <img
          src={ATAT}
          alt="AT-AT Logo"
          style={{ height: 70 }}
        />
      </a>
    </div>
  );
};

export default Logo;
