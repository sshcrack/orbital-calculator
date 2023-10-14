import { calculateOrbitalAction } from './controller/CalculateOrbitalAction';

/**
 * All application routes.
 */
export const AppRoutes = [
    {
        path: "/calculate/:id",
        method: "get",
        action: calculateOrbitalAction
    }
];