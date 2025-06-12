import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CapacityLoadAnalysis from '../CapacityLoadAnalysis';
import type { MasterDataType } from '../../../types';

const fetchRFQs = vi.fn();
const fetchNominalCapacities = vi.fn();
const fetchLoadPerUnit = vi.fn();

vi.mock('../../../lib/supabase', () => ({
  fetchRFQs
}));

vi.mock('../../../lib/capacity', () => ({
  fetchNominalCapacities,
  fetchLoadPerUnit
}));

const masterData: MasterDataType = {
  OEM: [],
  PROGRAM: [],
  CUSTOMER: [],
  PROCESS: [{ id: 'proc1', STANDARD_PROCESS: 'Proc1', PROCESS_DESCRIPTION: '' }],
  'GROUP DIVISION': [{ id: 'div1', DIVISION_NAME: 'DIV1', DIVISION_ABB: '' }],
  SITE: [{ id: 'site1', SITE_NAME: 'Site1', DIVISION_NAME: 'DIV1' }],
  PLANT: [{ id: 'plant1', PLANT_NAME: 'Plant1', SITE_NAME: 'Site1' }],
  'EXISTING PROCESS': [
    { id: 'ep1', STANDARD_PROCESS: 'Proc1', PLANT_NAME: 'Plant1' }
  ],
  DEPARTMENT: [],
  ROLE: [],
  STAKEHOLDER: []
};

vi.mock('../../../hooks/useMasterData', () => ({
  useMasterData: () => ({ masterData, loading: false })
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  fetchRFQs.mockReset();
  fetchNominalCapacities.mockReset();
  fetchLoadPerUnit.mockReset();

  fetchRFQs.mockResolvedValue([
    {
      reference: 'RFQ1',
      rfq_planning: [
        { team: 'PIN', planned_date: '2024-01-02' },
        { team: 'EOQ', planned_date: '2024-01-08' }
      ],
      rfq_worksharing: [
        { plant: 'Plant1', process: 'Proc1', qty_to_quote: 10 }
      ]
    }
  ]);
  fetchNominalCapacities.mockResolvedValue([
    { process_id: 'proc1', plant_id: 'plant1', weekly_hours: 40 }
  ]);
  fetchLoadPerUnit.mockResolvedValue([
    { process_id: 'proc1', plant_id: 'plant1', hours_per_unit: 1 }
  ]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CapacityLoadAnalysis', () => {
  it('displays load chart after selecting division', async () => {
    render(<CapacityLoadAnalysis />);

    await userEvent.click(screen.getByLabelText('DIV1'));

    expect(await screen.findByText('Plant1')).toBeInTheDocument();
    expect(screen.getByText('10.0h')).toBeInTheDocument();
    expect(fetchRFQs).toHaveBeenCalled();
  });

  it('opens week details popup on cell click', async () => {
    render(<CapacityLoadAnalysis />);
    await userEvent.click(screen.getByLabelText('DIV1'));

    const row = await screen.findByText('Plant1');
    const cell = within(row.closest('tr') as HTMLElement).getByText('10.0h');
    await userEvent.click(cell);

    expect(
      await screen.findByText('Week 1 (2024) Load Details')
    ).toBeInTheDocument();
  });
});
