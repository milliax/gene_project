declare module 'munkres-js'{
    export default function munkres(costMatrix: number[][]): number[][];
    export function printCostMatrix(costMatrix: number[][]): void;
    export function printAssignment(assignment: number[][]): void;
    export function printCost(costMatrix: number[][], assignment: number[][]): void;
    export function printAssignmentWithCost(costMatrix: number[][], assignment: number[][]): void;
}