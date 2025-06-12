import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewQuotePage from '../NewQuotePage';

const mockFetchMasterData = vi.fn();
const mockSaveRFQ = vi.fn();

vi.mock('../../lib/supabase', () => ({
  fetchMasterData: mockFetchMasterData,
  saveRFQ: mockSaveRFQ
}));

// Helper function to render the component with router context
const renderNewQuotePage = () => {
  return render(
    <BrowserRouter>
      <NewQuotePage />
    </BrowserRouter>
  );
};

describe('NewQuotePage Layout Tests', () => {
  beforeEach(() => {
    mockFetchMasterData.mockReset();
    mockSaveRFQ.mockReset();
    mockFetchMasterData.mockResolvedValue({
      OEM: [],
      PROGRAM: [],
      CUSTOMER: [],
      PROCESS: [],
      'GROUP DIVISION': [],
      SITE: [],
      PLANT: [],
      'EXISTING PROCESS': [],
      DEPARTMENT: [],
      ROLE: [],
      STAKEHOLDER: []
    });
    renderNewQuotePage();
  });

  it('should render the main form container', () => {
    const formElement = screen.getByRole('form');
    expect(formElement).toBeDefined();
    expect(formElement.className).toContain('h-[calc(100vh-4rem)]');
  });

  it('should render all required form fields', () => {
    // Test presence of main input fields
    expect(screen.getByLabelText(/reference/i)).toBeDefined();
    expect(screen.getByLabelText(/opportunity/i)).toBeDefined();
    expect(screen.getByLabelText(/customer/i)).toBeDefined();
  });

  it('should maintain correct layout structure', () => {
    // Test the main sections
    const mainContainer = screen.getByRole('form').parentElement;
    expect(mainContainer?.className).toContain('max-w-[90%]');

    // Test the flex container for the first row of inputs
    const inputRow = screen.getByLabelText(/reference/i).closest('.flex');
    expect(inputRow).toBeDefined();
    expect(inputRow?.className).toContain('gap-[3mm]');
  });

  it('should have correct input widths', () => {
    const referenceInput = screen.getByLabelText(/reference/i);
    const opportunityInput = screen.getByLabelText(/opportunity/i);
    
    expect(referenceInput.className).toContain('w-[10ch]');
    expect(opportunityInput.className).toContain('w-[24ch]');
  });

  it('should render all sections of the form', () => {
    // Test presence of main sections
    expect(screen.getByText(/general information/i)).toBeDefined();
    expect(screen.getByText(/planning/i)).toBeDefined();
    expect(screen.getByText(/worksharing/i)).toBeDefined();
  });

  it('should render action buttons', () => {
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /save/i })).toBeDefined();
  });
});