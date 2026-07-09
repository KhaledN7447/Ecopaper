export type Role = 'department_user' | 'facility_staff' | 'facility_manager'
export type PaperType = 'mixed' | 'shredded' | 'cardboard' | 'confidential'
export type Priority = 'normal' | 'urgent'
export type Status = 'pending' | 'assigned' | 'in_progress' | 'completed'

export interface Department {
  id: string
  name: string
  building: string
  created_at: string
}

export interface Profile {
  id: string
  name: string
  role: Role
  department_id: string | null
  created_at: string
  departments?: Department
}

export interface PickupRequest {
  id: string
  department_id: string
  building: string
  floor: string | null
  paper_type: PaperType
  estimated_weight: number
  actual_weight: number | null
  priority: Priority
  secure_disposal: boolean
  status: Status
  notes: string | null
  proof_image_url: string | null
  created_by: string
  assigned_to: string | null
  created_at: string
  completed_at: string | null
  department_name?: string
  created_by_name?: string
  assigned_to_name?: string
}

export interface RequestLog {
  id: string
  request_id: string
  action: string
  performed_by: string
  created_at: string
}

export interface NewRequestForm {
  building: string
  floor: string
  paper_type: PaperType
  estimated_weight: number
  priority: Priority
  secure_disposal: boolean
  notes: string
}
