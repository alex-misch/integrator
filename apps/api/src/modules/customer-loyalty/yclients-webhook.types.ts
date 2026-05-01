export type YClientRequest = {
  company_id?: number;
  resource?: 'record' | 'finances_operation' | string;
  resource_id?: number;
  status?: 'create' | 'update' | 'delete' | string;
  data?: {
    id?: number;
    company_id?: number;
    visit_id?: number;
    amount?: number;
    paid_full?: number | boolean;
    record_id?: number;
    document_id?: number;
    sold_item_id?: number;
    sold_item_type?: string;
    attendance?: number;
    visit_attendance?: number;
    deleted?: boolean;
    client?: {
      id?: number;
      name?: string;
      surname?: string;
      display_name?: string;
      phone?: string | number | null;
      email?: string;
    } | null;
  } | null;
};
