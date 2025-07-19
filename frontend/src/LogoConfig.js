/**
 * Logo Configuration
 * Centralized configuration for logo assets and company information
 */

const LogoConfig = {
  // Company Information
  company: {
    name: 'BITM',
    fullName: 'Blue Vision ',
    website: 'https://bitm.co.za/', // University of Pretoria
    description: 'COS301 Capstone Project'
  },
  
  // Logo Assets
  assets: {
    // Primary logos (recommended: SVG format)
    primary: {
      light: '/assets/logos/at-at-logo-light.svg',
      dark: '/assets/logos/at-at-logo-dark.svg'
    },
    
    // Alternative logos (PNG/JPG fallbacks)
    alternative: {
      light: '/assets/logos/at-at-logo-light.png',
      dark: '/assets/logos/at-at-logo-dark.png'
    },
    
    // Icon-only versions (for mobile or compact layouts)
    icon: {
      light: '/assets/logos/at-at-icon-light.svg',
      dark: '/assets/logos/at-at-icon-dark.svg'
    },
    
    // Favicon
    favicon: '/assets/logos/favicon.ico'
  },
  
  // Logo Display Settings
  display: {
    // Default dimensions
    maxWidth: '150px',
    height: '40px',
    
    // Mobile dimensions
    mobile: {
      maxWidth: '120px',
      height: '32px'
    },
    
    // Alt text for accessibility
    altText: 'AT-AT - API Threat Assessment Tool Logo',
    
    // Loading placeholder
    placeholder: 'AT-AT'
  },
  
  // Theme-specific settings
  themes: {
    light: {
      backgroundColor: '#ffffff',
      textColor: '#6b46c1',
      hoverColor: '#8a63d2'
    },
    dark: {
      backgroundColor: '#2d2d2d',
      textColor: '#a3bffa',
      hoverColor: '#c3d9ff'
    }
  },
  
  // Link behavior
  linkBehavior: {
    target: '_blank', // Open in new tab
    rel: 'noopener noreferrer', // Security attributes
    confirmNavigation: false // Set to true if you want confirmation dialog
  }
};

/**
 * Get logo path based on current theme
 * @param {boolean} isDarkMode - Current theme state
 * @param {string} variant - Logo variant ('primary', 'alternative', 'icon')
 * @returns {string} - Logo file path
 */
export const getLogoPath = (isDarkMode, variant = 'primary') => {
  const themeKey = isDarkMode ? 'dark' : 'light';
  return LogoConfig.assets[variant]?.[themeKey] || LogoConfig.assets.primary[themeKey];
};

/**
 * Get company information
 * @returns {Object} - Company details
 */
export const getCompanyInfo = () => LogoConfig.company;

/**
 * Get display settings for current breakpoint
 * @param {boolean} isMobile - Whether current view is mobile
 * @returns {Object} - Display configuration
 */
export const getDisplaySettings = (isMobile = false) => {
  return {
    ...LogoConfig.display,
    ...(isMobile ? LogoConfig.display.mobile : {})
  };
};

/**
 * Get theme-specific styling
 * @param {boolean} isDarkMode - Current theme state
 * @returns {Object} - Theme styling configuration
 */
export const getThemeStyles = (isDarkMode) => {
  return isDarkMode ? LogoConfig.themes.dark : LogoConfig.themes.light;
};

/**
 * Enhanced Logo Component with Configuration
 * Uses the centralized configuration for consistency
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

export default LogoConfig;