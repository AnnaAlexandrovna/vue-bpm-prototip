import { ShapeConfig } from "konva/lib/Shape";

export const configRhombus: ShapeConfig = {
    sceneFunc: function (context, shape) {
        context.beginPath();
        context.moveTo(0, 40);
        context.lineTo(130, 0);
        context.lineTo(260, 40);
        context.lineTo(130, 80);
        context.lineTo(0, 40);
        context.closePath();
        context.fillStrokeShape(shape);
    },
    fill: '#03c9a9',
    stroke: '#019875',
    strokeWidth: 1,
    x: 20,
    y: 750,
    draggable: true,
    width: 260,
    height: 80
}