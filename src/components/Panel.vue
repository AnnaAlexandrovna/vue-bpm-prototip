<template>
  <div>
    <div class="work-area">
      <div class="figure-panel">
        <v-stage
          :config="stageConfigForPanel"
          @mousedown="handleStageMouseDown"
          ref="stage"
        >
          <v-layer ref="layer" @dragmove="handleDrag" @dragend="handleStopDrag">
            <v-circle
              :config="configCircle"
              ref="mainCircle"
              @dragstart="handleDragStart(e, 'mainCircle')"
            ></v-circle>
            <v-rect
              :config="configRectangle"
              ref="mainRect"
              @dragstart="handleDragStart(e, 'mainRect')"
            />
            <v-shape
              :config="configRhombus"
              ref="mainRhomb"
              @dragstart="handleDragStart(e, 'mainRhomb')"
            />
            <v-transformer ref="transformer" />
          </v-layer>
        </v-stage>
      </div>
    </div>
    <div>
      <button @click="onSaveClick()">Сохранить</button>
      <input
        type="file"
        @change="onFileChanged($event)"
        accept=".json"
        capture
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { configCircle } from "@/constants/configCircle";
import { configRectangle } from "@/constants/configRectangle";
import { stageConfigForPanel } from "@/constants/configStage";
import { configRhombus } from "@/constants/configRhombus";
import { haveIntersection } from "@/utils/have.intersection.check";
import { ExportParameters } from "@/models/export.parameters";
import { calculateBounds } from "@/utils/calculate.bounds";
import { CloneParameters } from "@/models/clone.parameters";
import { Node } from "konva/lib/Node";
import { FigureParameters } from "@/models/figure.parameters";

@Options({})
export default class Panel extends Vue {
  stageConfigForPanel = stageConfigForPanel;
  configRectangle = configRectangle;
  configRhombus = configRhombus;
  configCircle = configCircle;
  selectedShapeName = "";
  rectCounter = 0;
  circleCounter = 0;
  rhombCounter = 0;
  object: ExportParameters = {
    rectangles: [],
    circles: [],
    rhombuses: [],
  };
  lastCoordinateWithoutIntersection: { x: number; y: number } | null = null;
  lastFigure: any;
  isIntersection = false;

  handleDragStart(e: any, figure: string) {
    const mainFigure = (this.$refs[figure] as Node).getStage();
    const layer = this.getLayer();
    if (mainFigure && layer) {
      mainFigure.stopDrag();
      const dragBoundFunc = calculateBounds(figure);
      const name = this.getNameAndUpdateCounter(figure);
      const clone = mainFigure.clone({
        name,
        dragBoundFunc,
      });
      clone.off("dragstart");
      if (figure === "mainRect") {
        clone.on("transformend", (e: any) => {
          const name = e.target.name();
          const layer = this.getLayer();
          if (layer && layer.children) {
            const rect = layer.children.find(
              (child: Node) => child.name() === name
            );
            if (rect) {
              rect.x(e.target.x());
              rect.y(e.target.y());
              rect.rotation(e.target.rotation());
              rect.scaleX(e.target.scaleX());
              rect.scaleY(e.target.scaleY());
            }
          }
        });
      }
      layer.add(clone);
      clone.startDrag();
    }
  }

  handleDrag(e: any) {
    if (!e.target.name()) {
      return;
    }
    const layer = this.getLayer();
    if (layer && layer.children) {
      const targetRect = e.target.getClientRect();
      this.lastFigure = e.target;
      this.isIntersection = false;
      layer.children.forEach((child: Node) => {
        if (
          child === this.lastFigure ||
          !child.name() ||
          child.name() === this.lastFigure.name()
        ) {
          return;
        }
        if (haveIntersection(child.getClientRect(), targetRect)) {
          this.isIntersection = true;
          return;
        }
      });
      if (!this.isIntersection) {
        this.lastCoordinateWithoutIntersection = {
          x: e.target.x(),
          y: e.target.y(),
        };
      }
    }
  }

  handleStopDrag() {
    if (this.isIntersection && this.lastCoordinateWithoutIntersection) {
      const layer = this.getLayer();
      if (layer && layer.children) {
        const child = layer.children.find(
          (child: Node) => child === this.lastFigure
        );
        if (child) {
          child.x(this.lastCoordinateWithoutIntersection.x);
          child.y(this.lastCoordinateWithoutIntersection.y);
        }
      }
    }
  }

  handleStageMouseDown(e: any) {
    if (!e.evt) {
      return;
    }
    if (e.target === e.target.getStage()) {
      this.selectedShapeName = "";
      this.updateTransformer();
      return;
    }
    const clickedOnTransformer =
      e.target.getParent().className === "Transformer";
    if (clickedOnTransformer) {
      return;
    }
    const name = e.target.name();
    if (name.startsWith("rect")) {
      this.selectedShapeName = name;
    } else {
      this.selectedShapeName = "";
    }
    this.updateTransformer();
  }

  updateTransformer() {
    const transformerNode = (this.$refs.transformer as any).getNode();
    if (transformerNode) {
      const stage = transformerNode.getStage();
      const { selectedShapeName } = this;
      const selectedNode = stage.findOne("." + selectedShapeName);
      if (selectedNode === transformerNode.node()) {
        return;
      }
      if (selectedNode) {
        transformerNode.nodes([selectedNode]);
      } else {
        transformerNode.nodes([]);
      }
    }
  }

  onSaveClick() {
    const layer = this.getLayer();
    if (layer && layer.children) {
      layer.children.forEach((child: Node) => {
        const name = child.name();
        if (name) {
          if (name.startsWith("rect")) {
            this.object.rectangles.push({
              x: child.x(),
              y: child.y(),
              scaleX: child.scaleX(),
              scaleY: child.scaleY(),
              rotation: child.rotation(),
            });
          } else if (name.startsWith("circle")) {
            this.object.circles.push({ x: child.x(), y: child.y() });
          } else if (name.startsWith("rhomb")) {
            this.object.rhombuses.push({ x: child.x(), y: child.y() });
          }
        }
      });
      const data = JSON.stringify(this.object);
      const blob = new Blob([data], { type: "text/plain" });
      const e = document.createEvent("MouseEvents");
      const a = document.createElement("a");
      a.download = "test.json";
      a.href = window.URL.createObjectURL(blob);
      a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
      e.initEvent("click", true, false);
      a.dispatchEvent(e);
    }
  }

  initLayerFromFile(readResult: string) {
    this.cleanLayer();
    const parameters: ExportParameters = JSON.parse(readResult);
    for (const key in parameters) {
      if (key === "rectangles" || key === "circles" || key === "rhombuses") {
        parameters[key as keyof ExportParameters].forEach(
          (element: FigureParameters) => {
            let figure = "";
            if (key === "rectangles") {
              figure = "mainRect";
            } else if (key === "circles") {
              figure = "mainCircle";
            } else {
              figure = "mainRhomb";
            }
            const name = this.getNameAndUpdateCounter(figure);
            const mainFigure = (this.$refs[figure] as Node).getStage();
            const layer = this.getLayer();
            if (mainFigure && layer) {
              const dragBoundFunc = calculateBounds(figure);
              const cloneParameters: CloneParameters = {
                name,
                x: element.x,
                y: element.y,
                dragBoundFunc,
              };
              if (element.scaleX && element.scaleY) {
                cloneParameters.scaleX = element.scaleX;
                cloneParameters.scaleY = element.scaleY;
                cloneParameters.rotation = element.rotation;
              }
              const clone = mainFigure.clone(cloneParameters);
              layer.add(clone);
            }
          }
        );
      }
    }
  }

  cleanLayer() {
    const layer = this.getLayer();
    if (layer && layer.children) {
      for (let i = 1; i <= this.rectCounter; i++) {
        const children = layer.children.find(
          (child: Node) => child.name() === `rect${i}`
        );
        if (children) {
          children.destroy();
        }
      }
      for (let i = 1; i <= this.circleCounter; i++) {
        const children = layer.children.find(
          (child: Node) => child.name() === `circle${i}`
        );
        if (children) {
          children.destroy();
        }
      }
      for (let i = 1; i <= this.rhombCounter; i++) {
        const children = layer.children.find(
          (child: Node) => child.name() === `rhomb${i}`
        );
        if (children) {
          children.destroy();
        }
      }
      this.rhombCounter = 0;
      this.circleCounter = 0;
      this.rectCounter = 0;
      this.selectedShapeName = "";
      this.updateTransformer();
    }
  }

  getNameAndUpdateCounter(figure: string) {
    let name;
    if (figure === "mainRect") {
      this.rectCounter++;
      name = `rect${this.rectCounter}`;
    } else if (figure === "mainCircle") {
      this.circleCounter++;
      name = `circle${this.circleCounter}`;
    } else {
      this.rhombCounter++;
      name = `rhomb${this.rhombCounter}`;
    }
    return name;
  }

  onFileChanged($event: Event) {
    const target = $event.target as HTMLInputElement;
    if (target && target.files) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (res) => {
        if (res.target && res.target.result) {
          this.initLayerFromFile(res.target.result as string);
        }
      };
      reader.onerror = (err) => console.log(err);
      reader.readAsText(file);
    }
  }

  getLayer() {
    return (this.$refs.layer as Node).getStage();
  }
}
</script>

<style scoped lang="scss">
@import '../styles/elements.scss';
.work-area {
  width: 1200px;
  height: 860px;
  border: 1px solid;
  display: flex;
}
.figure-panel {
  width: 300px;
  height: 860px;
  border-right: 1px solid;
}
</style>
