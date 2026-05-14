import { Plant } from "../models";
import { CreatePlantRequest, UpdatePlantRequest, DeletePlantRequest } from "../requests";
export declare const getAllPlants: () => Promise<Plant[]>;
export declare const getPlantById: (id: number) => Promise<Plant | null>;
export declare const getPlantsByUserId: (userId: number) => Promise<Plant[]>;
export declare const createPlant: (req: CreatePlantRequest) => Promise<Plant>;
export declare const updatePlant: (req: UpdatePlantRequest) => Promise<boolean>;
export declare const deletePlant: (req: DeletePlantRequest) => Promise<boolean>;
