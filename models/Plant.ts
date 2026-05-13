export interface Plant {
  id: number;
  date_created: Date;
  date_deleted: Date | null;
  date_updated: Date;
  name: string;
  species: string;
  watering_frequency_days: number;
}
