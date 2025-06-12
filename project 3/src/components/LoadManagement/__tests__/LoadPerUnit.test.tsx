import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoadPerUnit from '../LoadPerUnit';
import type { MasterDataType } from '../../../types';

const fetchLoadPerUnit = vi.fn();
const saveLoadPerUnit = vi.fn();

vi.mock('../../../lib/capacity', () => ({
  fetchLoadPerUnit,
  saveLoadPerUnit
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
  fetchLoadPerUnit.mockReset();
  saveLoadPerUnit.mockReset();
  fetchLoadPerUnit.mockResolvedValue([
    { process_id: 'proc1', plant_id: 'plant1', hours_per_unit: 2 }
  ]);
  saveLoadPerUnit.mockResolvedValue({});
});

describe('LoadPerUnit', () => {
  it('renders load rows after selecting division and site', async () => {
    render(<LoadPerUnit />);

    await userEvent.click(screen.getByLabelText('DIV1'));
    await userEvent.click(screen.getByLabelText('Site1'));

    expect(await screen.findByText('Plant1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(fetchLoadPerUnit).toHaveBeenCalled();
  });

  it('saves updated load value', async () => {
    render(<LoadPerUnit />);

    await userEvent.click(screen.getByLabelText('DIV1'));
    await userEvent.click(screen.getByLabelText('Site1'));

    const input = (await screen.findByDisplayValue('2')) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '5');

    const row = input.closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button'));

    expect(saveLoadPerUnit).toHaveBeenCalledWith('proc1', 'plant1', 5);
  });
});
