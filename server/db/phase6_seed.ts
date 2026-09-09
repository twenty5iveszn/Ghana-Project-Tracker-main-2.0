import { ProjectCommentRecord, ProjectVoteRecord, ProjectReportRecord } from './project_store';

export const INITIAL_PROJECT_COMMENTS: ProjectCommentRecord[] = [
  // Comments on PRJ-GAR-001 (Accra Outer Ring Road)
  {
    id: 'CMT-GAR-001-1',
    project_id: 'PRJ-GAR-001',
    user_id: 'usr-cit-001',
    user_name: 'Kojo Mensah',
    user_role: 'CITIZEN',
    content: 'The expansion of the dual carriageway has already eased morning gridlock between Pokuase and Graphic Road. Great engineering work, but please ensure pedestrian footbridges are prioritized before opening full traffic.',
    status: 'PUBLISHED',
    flag_reason: null,
    created_at: '2024-06-15T08:30:00.000Z',
    updated_at: '2024-06-15T08:30:00.000Z',
  },
  {
    id: 'CMT-GAR-001-2',
    project_id: 'PRJ-GAR-001',
    user_id: 'usr-cit-002',
    user_name: 'Abena Osei',
    user_role: 'CITIZEN',
    content: 'We noticed drainage trenches were being cleared during the recent rains. Glad to see flood-mitigation measures taking effect in the industrial section.',
    status: 'PUBLISHED',
    flag_reason: null,
    created_at: '2024-07-02T14:10:00.000Z',
    updated_at: '2024-07-02T14:10:00.000Z',
  },
  {
    id: 'CMT-GAR-001-3',
    project_id: 'PRJ-GAR-001',
    user_id: 'usr-mmdce-001',
    user_name: 'Hon. Kofi Adjei',
    user_role: 'MMDCE_OFFICER',
    content: 'Official MMDA Notice: The municipal engineering division has instructed the resident contractor (Consar Ltd) to deploy additional water sprinklers to curb dust during daytime grading.',
    status: 'PUBLISHED',
    flag_reason: null,
    created_at: '2024-07-05T10:00:00.000Z',
    updated_at: '2024-07-05T10:00:00.000Z',
  },

  // Comments on PRJ-ASH-002 (Kumasi Maternal & Child Health Hospital)
  {
    id: 'CMT-ASH-002-1',
    project_id: 'PRJ-ASH-002',
    user_id: 'usr-cit-003',
    user_name: 'Dr. Kwame Asante',
    user_role: 'COMMUNITY_OBSERVER',
    content: 'This 120-bed neonatal intensive care facility will relieve significant pressure on Komfo Anokye Teaching Hospital. Happy to see medical gas manifold ducting already installed in Section B.',
    status: 'PUBLISHED',
    flag_reason: null,
    created_at: '2024-07-18T16:20:00.000Z',
    updated_at: '2024-07-18T16:20:00.000Z',
  },
  {
    id: 'CMT-ASH-002-2',
    project_id: 'PRJ-ASH-002',
    user_id: 'usr-cit-001',
    user_name: 'Kojo Mensah',
    user_role: 'CITIZEN',
    content: 'Is there a backup solar generation system planned for the surgical suites during national grid interruptions?',
    status: 'PUBLISHED',
    flag_reason: null,
    created_at: '2024-08-01T09:45:00.000Z',
    updated_at: '2024-08-01T09:45:00.000Z',
  },

  // Comments on PRJ-NR-003 (Tamale North Water Supply)
  {
    id: 'CMT-NR-003-1',
    project_id: 'PRJ-NR-003',
    user_id: 'usr-cit-002',
    user_name: 'Abena Osei',
    user_role: 'CITIZEN',
    content: 'Clean piped water reaching Sagnarigu and Tamale North communities will dramatically reduce waterborne illnesses. Bravo to the Ministry of Sanitation and contractors.',
    status: 'PUBLISHED',
    flag_reason: null,
    created_at: '2024-06-25T11:15:00.000Z',
    updated_at: '2024-06-25T11:15:00.000Z',
  },
];

export const INITIAL_PROJECT_VOTES: ProjectVoteRecord[] = [
  // PRJ-GAR-001: High Civic Priority
  {
    id: 'VOT-GAR-001-1',
    project_id: 'PRJ-GAR-001',
    user_id: 'usr-cit-001',
    vote_type: 'UPVOTE',
    created_at: '2024-05-10T12:00:00.000Z',
  },
  {
    id: 'VOT-GAR-001-2',
    project_id: 'PRJ-GAR-001',
    user_id: 'usr-cit-002',
    vote_type: 'UPVOTE',
    created_at: '2024-05-12T14:30:00.000Z',
  },
  {
    id: 'VOT-GAR-001-3',
    project_id: 'PRJ-GAR-001',
    user_id: 'usr-cit-003',
    vote_type: 'UPVOTE',
    created_at: '2024-06-01T09:20:00.000Z',
  },

  // PRJ-ASH-002: Critical Healthcare Upvotes
  {
    id: 'VOT-ASH-002-1',
    project_id: 'PRJ-ASH-002',
    user_id: 'usr-cit-001',
    vote_type: 'UPVOTE',
    created_at: '2024-04-18T10:00:00.000Z',
  },
  {
    id: 'VOT-ASH-002-2',
    project_id: 'PRJ-ASH-002',
    user_id: 'usr-cit-002',
    vote_type: 'UPVOTE',
    created_at: '2024-04-22T11:30:00.000Z',
  },

  // PRJ-NR-003: Northern Water Supply
  {
    id: 'VOT-NR-003-1',
    project_id: 'PRJ-NR-003',
    user_id: 'usr-cit-003',
    vote_type: 'UPVOTE',
    created_at: '2024-05-28T15:45:00.000Z',
  },
];
