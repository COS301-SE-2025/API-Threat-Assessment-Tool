import React from 'react';
import LogoComponent from './LogoComponent';
import { getLogoPath, getCompanyInfo, getDisplaySettings } from './LogoConfig';

/**
 * Enhanced Logo Component with Configuration
 * Uses the centralized configuration for consistency with your existing App.js structure
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Logo variant ('primary', 'alternative', 'icon')
 * @param {boolean} props.isMobile - Whether current view is mobile
 * @param {string} props.className - Additional CSS classes
 * @param {...Object} props - Additional props passed to LogoComponent
 */
export const ConfiguredLogoComponent = ({ 
  variant = 'primary',
  isMobile = false,
  className = '',
  ...props 
}) => {
  const displaySettings = getDisplaySettings(isMobile);
  const companyInfo = getCompanyInfo();
  
  return (
    <LogoComponent
      companyUrl={companyInfo.website}
      logoText={companyInfo.name}
      lightModeLogo={getLogoPath(false, variant)}
      darkModeLogo={getLogoPath(true, variant)}
      altText={displaySettings.altText}
      className={`configured-logo ${className}`}
      {...props}
    />
  );
};

export default ConfiguredLogoComponent;