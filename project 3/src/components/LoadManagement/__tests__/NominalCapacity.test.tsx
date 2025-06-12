import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NominalCapacity from '../NominalCapacity';
import type { MasterDataType } from '../../../types';

const fetchNominalCapacities = vi.fn();
const saveNominalCapacity = vi.fn();

vi.mock('../../../lib/capacity', () => ({
  fetchNominalCapacities,
  saveNominalCapacity
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
  fetchNominalCapacities.mockReset();
  saveNominalCapacity.mockReset();
  fetchNominalCapacities.mockResolvedValue([
    { process_id: 'proc1', plant_id: 'plant1', weekly_hours: 5 }
  ]);
  saveNominalCapacity.mockResolvedValue({});
});

describe('NominalCapacity', () => {
  it('renders capacity rows after selecting division and site', async () => {
    render(<NominalCapacity />);

    await userEvent.click(screen.getByLabelText('DIV1'));
    await userEvent.click(screen.getByLabelText('Site1'));

    expect(await screen.findByText('Plant1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(fetchNominalCapacities).toHaveBeenCalled();
  });

  it('saves updated capacity value', async () => {
    render(<NominalCapacity />);

    await userEvent.click(screen.getByLabelText('DIV1'));
    await userEvent.click(screen.getByLabelText('Site1'));

    const input = (await screen.findByDisplayValue('5')) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '20');

    const row = input.closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button'));

    expect(saveNominalCapacity).toHaveBeenCalledWith('proc1', 'plant1', 20);
  });
});
