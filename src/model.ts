export interface Record {
  id: string; // this should be a UUID
  code: string; // this is the data to generate the QR code
  lastUpdated: number; // this is the timestamp of the last update to the record
}

export interface Profile {
  id: string; // this should be a UUID
  name: string; // this is the name of the profile
  records: Record[]; // this is the list of records associated with the profile
}
