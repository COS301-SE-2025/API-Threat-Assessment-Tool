import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeContext } from '../App';
import ManageAPIs from '../ManageAPIs';

// Mock useAuth hook
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    currentUser: { username: 'testuser', firstName: 'Test' },
    logout: jest.fn(),
    getUserFullName: () => 'Test User',
  }),
  AuthProvider: ({ children }) => <>{children}</>,
}));

const customRender = (ui) =>
  render(
    <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: jest.fn() }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeContext.Provider>
  );

describe('ManageAPIs Component', () => {
  test('renders API list table', async () => {
    customRender(<ManageAPIs />);
    expect(await screen.findByText(/My E-commerce Site API/i)).toBeInTheDocument();
    expect(screen.getByText(/Client Project API/i)).toBeInTheDocument();
    expect(screen.getByText(/Internal User Service/i)).toBeInTheDocument();
  });

  test('opens and closes Add API modal', async () => {
    customRender(<ManageAPIs />);
    fireEvent.click(await screen.findByText('+ Add API'));
    expect(screen.getByText(/Add New API/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(screen.queryByText(/Add New API/i)).not.toBeInTheDocument();
  });

  test('adds a new API', async () => {
    customRender(<ManageAPIs />);
    fireEvent.click(await screen.findByText('+ Add API'));

    fireEvent.change(screen.getByLabelText(/API Name/i), { target: { value: 'Test API' } });
    fireEvent.change(screen.getByLabelText(/Base URL/i), { target: { value: 'https://test.api' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Testing API' } });
    fireEvent.change(screen.getByLabelText(/Status/i), { target: { value: 'Active' } });
    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(screen.getByText('Test API')).toBeInTheDocument();
    });
  });

  test('edits an existing API', async () => {
    customRender(<ManageAPIs />);
    fireEvent.click((await screen.findAllByText(/Edit/i))[0]);
    const input = screen.getByLabelText(/API Name/i);
    fireEvent.change(input, { target: { value: 'Updated API' } });
    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(screen.getByText('Updated API')).toBeInTheDocument();
    });
  });

 test('deletes an API', async () => {
  customRender(<ManageAPIs />);
  fireEvent.click((await screen.findAllByText(/Delete/i))[0]);

  const modal = screen.getByText(/Confirm Delete/i).closest('.modal-content');
  expect(modal).toBeInTheDocument();

const scopedDeleteButton = within(modal).getByRole('button', { name: /^Delete$/i });
fireEvent.click(scopedDeleteButton);


  await waitFor(() => {
    expect(screen.queryByText(/My E-commerce Site API/i)).not.toBeInTheDocument();
  });
});

});
