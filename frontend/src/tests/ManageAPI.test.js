import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ManageAPIs from '../ManageAPIs';
import { ThemeContext } from '../App';
import { MemoryRouter } from 'react-router-dom';

// Wrap with ThemeContext and Router
const customRender = (ui) =>
  render(
    <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: jest.fn() }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeContext.Provider>
  );

describe('ManageAPIs Component Tests', () => {
  test('renders Manage APIs page with correct title and elements', () => {
    customRender(<ManageAPIs />);
    expect(screen.getByRole('heading', { name: /Manage APIs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Add API/i })).toBeInTheDocument();
    expect(screen.getByText(/AT-AT/i)).toBeInTheDocument();
  });

  test('displays existing APIs in the table', () => {
    customRender(<ManageAPIs />);
    expect(screen.getByText('My E-commerce Site API')).toBeInTheDocument();
    expect(screen.getByText('Client Project API')).toBeInTheDocument();
    expect(screen.getByText('Internal User Service')).toBeInTheDocument();
  });

  test('opens Add API modal', async () => {
    customRender(<ManageAPIs />);
    fireEvent.click(screen.getByRole('button', { name: /\+ Add API/i }));
    await waitFor(() => screen.getByText(/Add New API/i));
    expect(screen.getByLabelText(/API Name/i)).toBeInTheDocument();
  });

  test('opens Edit API modal', async () => {
    customRender(<ManageAPIs />);
    fireEvent.click(screen.getAllByText('Edit')[0]);
    await waitFor(() => screen.getByText(/Edit API/i));
    expect(screen.getByLabelText(/API Name/i)).toHaveValue('My E-commerce Site API');
  });

  test('closes modal with Cancel and X', async () => {
    customRender(<ManageAPIs />);
    fireEvent.click(screen.getByRole('button', { name: /\+ Add API/i }));
    await waitFor(() => screen.getByText(/Add New API/i));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => expect(screen.queryByText(/Add New API/i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /\+ Add API/i }));
    await waitFor(() => screen.getByText(/Add New API/i));
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    await waitFor(() => expect(screen.queryByText(/Add New API/i)).not.toBeInTheDocument());
  });

  test('opens delete confirmation', async () => {
    customRender(<ManageAPIs />);
    fireEvent.click(screen.getAllByText('Delete')[0]);
    await waitFor(() => screen.getByText(/Confirm Delete/i));
    expect(screen.getByText((content) =>
    content.includes('Are you sure') && content.includes('My E-commerce Site API')
    )).toBeInTheDocument();

  });

  test('validates required fields', async () => {
    customRender(<ManageAPIs />);
    fireEvent.click(screen.getByRole('button', { name: /\+ Add API/i }));
    await waitFor(() => screen.getByText(/Add New API/i));
    expect(screen.getByLabelText(/API Name/i)).toHaveAttribute('required');
    expect(screen.getByLabelText(/Base URL/i)).toHaveAttribute('required');
  });

  test('updates form input state', async () => {
    customRender(<ManageAPIs />);
    fireEvent.click(screen.getByRole('button', { name: /\+ Add API/i }));
    await waitFor(() => screen.getByText(/Add New API/i));
    const name = screen.getByLabelText(/API Name/i);
    fireEvent.change(name, { target: { value: 'X-Test' } });
    expect(name).toHaveValue('X-Test');
  });

  test('navigation links exist', () => {
    customRender(<ManageAPIs />);
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();
  });

  test('logout and user info display', () => {
    customRender(<ManageAPIs />);
    expect(screen.getByText(/Welcome, User!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });

  test('correct API table content', () => {
    customRender(<ManageAPIs />);
    expect(screen.getByText('https://api.ecommerce.com/v1')).toBeInTheDocument();
    expect(screen.getByText('Main API for the e-commerce platform')).toBeInTheDocument();
    expect(screen.getByText('2025-05-14')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.getAllByText('Inactive')).toHaveLength(1);
  });

  test('has 3 Edit and 3 Delete buttons', () => {
    customRender(<ManageAPIs />);
    expect(screen.getAllByText('Edit')).toHaveLength(3);
    expect(screen.getAllByText('Delete')).toHaveLength(3);
  });
});
