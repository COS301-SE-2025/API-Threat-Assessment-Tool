import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeContext } from '../App';
// import Signup from '../Signup';
import Login from '../Login';
import Dashboard from '../Dashboard';
import Home from '../Home';
import Settings from '../Settings';
import ManageAPIs from '../ManageAPIs';
import PublicTemplates from '../PublicTemplates';
import StartScan from '../StartScan';


const customRender = (ui) =>
  render(
    <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: jest.fn() }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeContext.Provider>
  );

describe('Component Rendering (Simple)', () => {
test('StartScan renders form and button', () => {
  customRender(<StartScan />);
  expect(screen.getByRole('heading', { name: /start a new scan/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /start scan now/i })).toBeInTheDocument();
});
// test('Signup renders form fields and button', () => {
//   customRender(<Signup />);
  
//   expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
//   expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
//   expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
//   expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
// });

  test('Login renders login button', () => {
    customRender(<Login />);
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('Dashboard shows section headings', () => {
    customRender(<Dashboard />);
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Scan Configuration/i)).toBeInTheDocument();
  });

  test('Home shows welcome message', () => {
    customRender(<Home />);
    expect(screen.getByText(/Welcome to AT-AT/i)).toBeInTheDocument();
  });

  test('Settings shows profile fields', () => {
    customRender(<Settings />);
    expect(screen.getByDisplayValue(/John Doe/i)).toBeInTheDocument();
  });

  test('Manage APIs shows default entries', () => {
    customRender(<ManageAPIs />);
    expect(screen.getByText('My E-commerce Site API')).toBeInTheDocument();
  });

  test('Public Templates renders search input', () => {
    customRender(<PublicTemplates />);
    expect(screen.getByPlaceholderText(/Search templates/i)).toBeInTheDocument();
  });
});
