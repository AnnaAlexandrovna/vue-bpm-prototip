import { configCircle } from "@/constants/configCircle";
import { configRectangle } from "@/constants/configRectangle";
import { stageConfigForPanel } from "@/constants/configStage";

export function calculateBounds(figure: string) {
    const indent = 5;
    const workAreaStart = 300;
    let xBoundMax = stageConfigForPanel.width - indent;
    let yBoundMax = stageConfigForPanel.height - indent;
    let xBoundMin = workAreaStart + indent;
    let yBoundMin = indent;
    if (figure === "mainCircle" && configCircle.radius) {
        xBoundMax -= configCircle.radius;
        yBoundMax -= configCircle.radius;
        xBoundMin += configCircle.radius;
        yBoundMin += configCircle.radius;
    } else if (
        figure === "mainRect" &&
        configRectangle.width &&
        configRectangle.height
    ) {
        xBoundMax -= configRectangle.width;
        yBoundMax -= configRectangle.height;
    } else {
        xBoundMax -= 260;
        yBoundMax -= 80;
        xBoundMin -= 0;
    }
    const dragBoundFunc = (pos: { x: number; y: number }) => {
        const x = Math.min(Math.max(pos.x, xBoundMin), xBoundMax);
        const y = Math.min(Math.max(pos.y, yBoundMin), yBoundMax);
        return { x, y };
    }
    return dragBoundFunc;
}