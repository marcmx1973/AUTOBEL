export type MasterDataType = {
  OEM: Array<{
    id: string;
    OEM_NAME: string;
    OEM_ABB: string;
    COUNTRY: string;
  }>;
  PROGRAM: Array<{
    id: string;
    PROGRAM_NAME: string;
    OEM_NAME: string;
  }>;
  CUSTOMER: Array<{
    id: string;
    CUSTOMER_NAME: string;
    CUSTOMER_ABB: string;
    COUNTRY: string;
  }>;
  PROCESS: Array<{
    id: string;
    STANDARD_PROCESS: string;
    PROCESS_DESCRIPTION: string;
  }>;
  'GROUP DIVISION': Array<{
    id: string;
    DIVISION_NAME: string;
    DIVISION_ABB: string;
  }>;
  SITE: Array<{
    id: string;
    SITE_NAME: string;
    DIVISION_NAME: string;
  }>;
  PLANT: Array<{
    id: string;
    PLANT_NAME: string;
    SITE_NAME: string;
  }>;
  'EXISTING PROCESS': Array<{
    id: string;
    STANDARD_PROCESS: string;
    PLANT_NAME: string;
  }>;
  DEPARTMENT: Array<{
    id: string;
    DEPARTMENT: string;
  }>;
  ROLE: Array<{
    id: string;
    ROLE: string;
  }>;
  STAKEHOLDER: Array<{
    id: string;
    STAKEHOLDER_NAME: string;
    DEPARTMENT: string;
    PLANT_NAME: string;
    ROLE: string;
  }>;
};

export type TeamType = 'BLU' | 'PIN' | 'EOQ' | 'GRE' | 'RED';

export type PlanningStep = {
  id: string;
  name: string;
  role_in_charge: string;
  starting_step: TeamType;
  end_step: TeamType;
  created_at: string;
  created_by: string;
  updated_at: string;
};