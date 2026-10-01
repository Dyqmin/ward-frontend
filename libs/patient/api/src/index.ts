// The published language of the patient context: the only part of it other scopes may import.
// Everything else in libs/patient stays private, so it can change without telling anyone.
export { PatientsStore, patientResource } from '@wm/patient/data-access';
