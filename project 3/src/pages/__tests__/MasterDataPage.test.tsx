import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MasterDataPage from '../MasterDataPage';

const fromMock = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    auth: { getUser: vi.fn() }
  }
}));

const oemData = [{ id: '1', name: 'OEM1', abbreviation: 'O1', country: 'US' }];

beforeEach(() => {
  fromMock.mockImplementation(() => ({
    select: vi.fn(() => Promise.resolve({ data: oemData, error: null })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }))
  }));
});

describe('MasterDataPage', () => {
  it('displays table after selecting a category', async () => {
    render(<MasterDataPage />);

    await userEvent.click(screen.getByText('OEM'));

    expect(await screen.findByRole('button', { name: /Add New/i })).toBeInTheDocument();
    expect(screen.getByText('OEM1')).toBeInTheDocument();
  });

  it('opens form modal when adding new item', async () => {
    render(<MasterDataPage />);
    await userEvent.click(screen.getByText('OEM'));

    const addBtn = await screen.findByRole('button', { name: /Add New/i });
    await userEvent.click(addBtn);
    expect(screen.getByText('Add New OEM')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByText('Add New OEM')).not.toBeInTheDocument();
  });

  it('opens delete confirmation modal', async () => {
    render(<MasterDataPage />);
    await userEvent.click(screen.getByText('OEM'));
    const row = await screen.findByText('OEM1');
    const buttons = within(row.closest('tr') as HTMLElement).getAllByRole('button');
    await userEvent.click(buttons[1]);
    expect(screen.getByText(/Confirm Delete/i)).toBeInTheDocument();
  });
});
