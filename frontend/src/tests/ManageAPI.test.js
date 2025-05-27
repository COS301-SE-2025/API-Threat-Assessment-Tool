import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ManageAPIs from '../ManageAPIs';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn()
}));

/**
 * Test suite for ManageAPIs component
 * Tests API management functionality including CRUD operations
 */
describe('ManageAPIs Component Tests', () => {
  test('renders Manage APIs page with correct title and elements', () => {
    render(<ManageAPIs />);
    
    // Use role selector to be more specific about which heading we want
    expect(screen.getByRole('heading', { name: /Manage APIs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add API/i })).toBeInTheDocument();
    expect(screen.getByText(/AT-AT/i)).toBeInTheDocument();
  });

  test('displays existing APIs in the table', () => {
    render(<ManageAPIs />);
    
    // Check if default APIs are displayed
    expect(screen.getByText('My E-commerce Site API')).toBeInTheDocument();
    expect(screen.getByText('Client Project API')).toBeInTheDocument();
    expect(screen.getByText('Internal User Service')).toBeInTheDocument();
    
    // Check table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Base URL')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Last Scanned')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  test('opens Add API modal when "+ Add API" button is clicked', async () => {
    render(<ManageAPIs />);
    
    const addButton = screen.getByRole('button', { name: /Add API/i });
    fireEvent.click(addButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Add New API/i)).toBeInTheDocument();
    });
    
    // Check modal form elements
    expect(screen.getByLabelText(/API Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Base URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
  });

  test('opens Edit API modal when Edit button is clicked', async () => {
    render(<ManageAPIs />);
    
    // Find and click the first Edit button
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Edit API/i)).toBeInTheDocument();
    });
    
    // Check that form is populated with existing data
    const nameInput = screen.getByLabelText(/API Name/i);
    expect(nameInput.value).toBe('My E-commerce Site API');
  });

  test('closes modal when Cancel button is clicked', async () => {
    render(<ManageAPIs />);
    
    // Open modal
    const addButton = screen.getByRole('button', { name: /Add API/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Add New API/i)).toBeInTheDocument();
    });
    
    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText(/Add New API/i)).not.toBeInTheDocument();
    });
  });

  test('closes modal when X button is clicked', async () => {
    render(<ManageAPIs />);
    
    // Open modal
    const addButton = screen.getByRole('button', { name: /Add API/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Add New API/i)).toBeInTheDocument();
    });
    
    // Click X button
    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText(/Add New API/i)).not.toBeInTheDocument();
    });
  });

  test('opens delete confirmation when Delete button is clicked', async () => {
    render(<ManageAPIs />);
    
    // Find and click the first Delete button
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Wait for confirmation modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Confirm Delete/i)).toBeInTheDocument();
    });
    
    // Check confirmation message
    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
    expect(screen.getByText(/My E-commerce Site API/i)).toBeInTheDocument();
  });

  test('validates required fields in the form', async () => {
    render(<ManageAPIs />);
    
    // Open add modal
    const addButton = screen.getByRole('button', { name: /Add API/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Add New API/i)).toBeInTheDocument();
    });
    
    // Check that required fields have the required attribute
    const nameInput = screen.getByLabelText(/API Name/i);
    const urlInput = screen.getByLabelText(/Base URL/i);
    
    expect(nameInput).toHaveAttribute('required');
    expect(urlInput).toHaveAttribute('required');
  });

  test('updates form fields when user types', async () => {
    render(<ManageAPIs />);
    
    // Open add modal
    const addButton = screen.getByRole('button', { name: /Add API/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Add New API/i)).toBeInTheDocument();
    });
    
    // Type in form fields
    const nameInput = screen.getByLabelText(/API Name/i);
    const urlInput = screen.getByLabelText(/Base URL/i);
    const descInput = screen.getByLabelText(/Description/i);
    
    fireEvent.change(nameInput, { target: { value: 'Test API' } });
    fireEvent.change(urlInput, { target: { value: 'https://api.test.com' } });
    fireEvent.change(descInput, { target: { value: 'Test description' } });
    
    expect(nameInput.value).toBe('Test API');
    expect(urlInput.value).toBe('https://api.test.com');
    expect(descInput.value).toBe('Test description');
  });

  test('renders navigation links correctly', () => {
    render(<ManageAPIs />);
    
    // Check navigation links (they are rendered as <a> tags due to our Link mock)
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();
  });

  test('displays user info and logout button', () => {
    render(<ManageAPIs />);
    
    // Check user info section
    expect(screen.getByText('Welcome, User!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });

  test('displays API data correctly in table rows', () => {
    render(<ManageAPIs />);
    
    // Check specific API data
    expect(screen.getByText('https://api.ecommerce.com/v1')).toBeInTheDocument();
    expect(screen.getByText('Main API for the e-commerce platform')).toBeInTheDocument();
    expect(screen.getByText('2025-05-14')).toBeInTheDocument();
    
    // Check status values
    const activeStatuses = screen.getAllByText('Active');
    const inactiveStatuses = screen.getAllByText('Inactive');
    expect(activeStatuses).toHaveLength(2);
    expect(inactiveStatuses).toHaveLength(1);
  });

  test('has correct number of action buttons', () => {
    render(<ManageAPIs />);
    
    // Should have 3 Edit buttons and 3 Delete buttons (one for each API)
    const editButtons = screen.getAllByText('Edit');
    const deleteButtons = screen.getAllByText('Delete');
    
    expect(editButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);
  });
});