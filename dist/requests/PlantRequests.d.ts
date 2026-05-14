export interface CreatePlantRequest {
    name: string;
    species: string;
    watering_frequency_days: number;
    user_id: number;
}
export interface UpdatePlantRequest {
    id: number;
    name?: string;
    species?: string;
    watering_frequency_days?: number;
}
export interface DeletePlantRequest {
    id: number;
}
