import { render, screen, fireEvent } from '@testing-library/react';
import ToolsDisplay from '../ToolsDisplay';

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (element: React.ReactNode) => element,
}));

const mockSkills = [
  {
    id: 'create_directory',
    name: 'Create Directory',
    description: 'Create a new directory',
    tags: ['general'],
  },
  {
    id: 'file_read',
    name: 'File Read',
    description: 'Read contents of files',
    tags: ['general'],
  },
  {
    id: 'execute_command',
    name: 'Execute Command',
    description: 'Execute a safe shell command',
    tags: ['general'],
  },
];

describe('ToolsDisplay', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 40,
      top: 100,
      left: 200,
      bottom: 140,
      right: 300,
      x: 200,
      y: 100,
      toJSON: jest.fn(),
    }));

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('renders tools button with correct count', () => {
    render(<ToolsDisplay skills={mockSkills} />);
    
    expect(screen.getByText('3 tools')).toBeInTheDocument();
  });

  it('does not render when skills array is empty', () => {
    const { container } = render(<ToolsDisplay skills={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows dropdown on click', () => {
    render(<ToolsDisplay skills={mockSkills} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Available Tools (3)')).toBeInTheDocument();
    expect(screen.getByText('Create Directory')).toBeInTheDocument();
    expect(screen.getByText('File Read')).toBeInTheDocument();
    expect(screen.getByText('Execute Command')).toBeInTheDocument();
  });

  it('shows tool descriptions in dropdown', () => {
    render(<ToolsDisplay skills={mockSkills} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Create a new directory')).toBeInTheDocument();
    expect(screen.getByText('Read contents of files')).toBeInTheDocument();
    expect(screen.getByText('Execute a safe shell command')).toBeInTheDocument();
  });

  it('shows tool tags in dropdown', () => {
    render(<ToolsDisplay skills={mockSkills} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const tags = screen.getAllByText('general');
    expect(tags).toHaveLength(3);
  });

  it('closes dropdown with close button', () => {
    render(<ToolsDisplay skills={mockSkills} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Available Tools (3)')).toBeInTheDocument();
    
    const closeButton = screen.getByTitle('Close tools panel');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Available Tools (3)')).not.toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<ToolsDisplay skills={mockSkills} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Available Tools');
  });
});