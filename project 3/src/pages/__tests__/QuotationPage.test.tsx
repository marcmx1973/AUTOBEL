import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuotationPage from '../QuotationPage';

const mockFetchRFQs = vi.fn();
const mockFetchRFQComments = vi.fn();
const mockDeleteRFQ = vi.fn();

vi.mock('../../lib/supabase', () => ({
  fetchRFQs: mockFetchRFQs,
  fetchRFQComments: mockFetchRFQComments,
  deleteRFQ: mockDeleteRFQ,
  fetchRFQ: vi.fn(),
  updateRFQ: vi.fn(),
  addRFQComment: vi.fn(),
  supabase: { auth: { getUser: vi.fn() }, from: vi.fn() }
}));

const rfqs = [
  {
    id: '1',
    reference: 'REF1',
    opportunity: 'Opp1',
    customer: 'Cust1',
    program: 'Prog1',
    phase_status: 'OPEN',
    due_date: '2024-01-01',
    created_at: '2024-01-01',
    rfq_planning: [],
    rfq_worksharing: []
  },
  {
    id: '2',
    reference: 'REF2',
    opportunity: 'Opp2',
    customer: 'Cust2',
    program: 'Prog2',
    phase_status: 'OPEN',
    due_date: '2024-01-02',
    created_at: '2024-01-02',
    rfq_planning: [],
    rfq_worksharing: []
  }
];

const comment = {
  id: 'c1',
  rfq_id: '1',
  comment: 'latest',
  created_at: '2024-01-03',
  created_by: '1'
};

describe('QuotationPage', () => {
  beforeEach(() => {
    mockFetchRFQs.mockReset();
    mockFetchRFQComments.mockReset();
    mockDeleteRFQ.mockReset();
  });

  it('renders RFQ rows after loading', async () => {
    mockFetchRFQs.mockResolvedValue(rfqs);
    mockFetchRFQComments.mockImplementation(async (id: string) => id === '1' ? [comment] : []);

    render(<QuotationPage />);

    expect(await screen.findByText('REF1')).toBeInTheDocument();
    expect(screen.getByText('REF2')).toBeInTheDocument();
    expect(screen.getByText('latest')).toBeInTheDocument();
    expect(mockFetchRFQs).toHaveBeenCalled();
  });

  it('allows deleting an RFQ', async () => {
    mockFetchRFQs.mockResolvedValue(rfqs);
    mockFetchRFQComments.mockResolvedValue([]);
    mockDeleteRFQ.mockResolvedValue(undefined);

    render(<QuotationPage />);

    await screen.findByText('REF1');

    const deleteBtn = screen.getAllByTitle('Delete')[0];
    await userEvent.click(deleteBtn);
    expect(screen.getByText(/Confirmer la suppression/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Supprimer/i }));
    expect(mockDeleteRFQ).toHaveBeenCalledWith('1');
  });
});
