import { FigureParameters } from "./figure.parameters";

export interface CloneParameters extends FigureParameters {
    dragBoundFunc: Function,
    name: string
}