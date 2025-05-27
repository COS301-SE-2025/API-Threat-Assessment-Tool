import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Signup from '../Signup';
import Login from '../Login';
import Dashboard from '../Dashboard';
import Home from '../Home';
import Settings from '../Settings';
import ManageAPIs from '../ManageAPIs';
import PublicTemplates from '../PublicTemplates';

/**
 * Test suite for individual components without routing
 * Tests each component in isolation for better reliability
 */
describe('Component Rendering Tests', () => {
  // Mock useNavigate for components that use it
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    // Mock react-router-dom hooks
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders Signup component with correct elements', () => {
    render(<Signup />);
    
    expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });

  test('renders Login component with correct elements', () => {
    render(<Login />);
    
    expect(screen.getByRole('heading', { name: /^Login$/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Login$/i })).toBeInTheDocument();
  });

  test('renders Dashboard component with main elements', () => {
    render(<Dashboard />);
    
    expect(screen.getByRole('heading', { name: /^Dashboard$/i })).toBeInTheDocument();
    expect(screen.getByText(/Start New Scan/i)).toBeInTheDocument();
    expect(screen.getByText(/Scan Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent Scan Activity/i)).toBeInTheDocument();
  });

  test('renders Home component with welcome message', () => {
    render(<Home />);
    
    expect(screen.getByText(/Welcome to AT-AT/i)).toBeInTheDocument();
    expect(screen.getByText(/API Threat Assessment Tool/i)).toBeInTheDocument();
    expect(screen.getByText(/Why Use AT-AT/i)).toBeInTheDocument();
  });

  test('renders Settings component with tabs', () => {
    render(<Settings />);
    
    expect(screen.getByRole('heading', { name: /^Settings$/i })).toBeInTheDocument();
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/Security/i)).toBeInTheDocument();
  });

  test('renders ManageAPIs component with API table', () => {
    render(<ManageAPIs />);
    
    // Use more specific selectors to avoid multiple matches
    expect(screen.getByRole('heading', { name: /Manage APIs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add API/i })).toBeInTheDocument();
    expect(screen.getByText('My E-commerce Site API')).toBeInTheDocument();
    expect(screen.getByText('Client Project API')).toBeInTheDocument();
  });

  test('renders PublicTemplates component with search', () => {
    render(<PublicTemplates />);
    
    expect(screen.getByRole('heading', { name: /Public Templates/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search templates/i)).toBeInTheDocument();
    expect(screen.getByText(/All Templates/i)).toBeInTheDocument();
  });
});

describe('Form Interaction Tests', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
    }));
  });

  test('signup form has required fields', () => {
    render(<Signup />);
    
    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('login form has required fields', () => {
    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('settings form displays user information', () => {
    render(<Settings />);
    
    // Check if form elements are present (they're rendered by default in profile tab)
    expect(screen.getByDisplayValue(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/john.doe@example.com/i)).toBeInTheDocument();
  });
});

describe('Navigation Elements Tests', () => {
  test('components have proper navigation structure', () => {
    render(<Dashboard />);
    
    // Check navigation links
    expect(screen.getByText('AT-AT')).toBeInTheDocument(); // Logo
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome, User!/i)).toBeInTheDocument();
  });

  test('manage APIs has proper table structure', () => {
    render(<ManageAPIs />);
    
    // Check table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Base URL')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Last Scanned')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});