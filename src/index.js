const canvasWidth = 660;
const canvasHeight = 480;
const gridChunkSize = 60;

const DEBUG = true;

class GridSquare {
    constructor (opts) {
        this.x = opts.x;
        this.y = opts.y;
        this.isTarget = false;
        this.isStart = false;
        this.isWall = false;
        this.costs = {
            // distance from node to start node
            g: 0,
            // distance from this node to target node
            h: 0,
            // combined g/h cost
            f: 0
        }
    }


    draw (overrideFillStyle) {
        ctx.fillStyle = overrideFillStyle || this.getFillStyle();
        ctx.fillRect(this.x * gridChunkSize, this.y * gridChunkSize, gridChunkSize, gridChunkSize);
        this.setStrokeStyle();
        ctx.strokeRect(this.x * gridChunkSize, this.y * gridChunkSize, gridChunkSize, gridChunkSize);

        if (DEBUG) {
            ctx.font = '10px sans-serif';
            ctx.fillStyle = "#000000";
           
            // console.log("cellCosts", this.costs);
            if (this.costs.g) {
                ctx.fillText(this.costs.g, this.x * gridChunkSize + 5, this.y * gridChunkSize + 15);    
                ctx.fillText(this.costs.h, this.x * gridChunkSize + 35, this.y * gridChunkSize + 15);

                ctx.font = '20px sans-serif';
                ctx.fillText(this.costs.f, this.x * gridChunkSize + 20, this.y * gridChunkSize + 40);
            }
            
        }
    }


    getAdjacent () {
        let allAdjacent = [];
        let vectors = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

        vectors.forEach(function (vector) {
            let row = grid[this.x - vector[0]];
            if (row) {
                let cell = row[this.y - vector[1]];
                if (cell) {
                    allAdjacent.push(cell);
                }
            }
        }.bind(this));
        
        return allAdjacent;
    }


    setStrokeStyle () {
        if (this.inOpenList) {
            ctx.strokeStyle = "#00FF00";
            ctx.lineWidth = 5;
        }
        else if (this.inClosedList) {
            ctx.strokeStyle = "#FF0000";
            ctx.lineWidth = 5;
        }
        else {
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
        }
    }


    getFillStyle () {
        if (this.isTarget) {
            return "rgba(200, 25, 50, 0.6)"; 
        }
        else if (this.isStart) {
            return "rgba(50, 200, 50, 0.4)";
        }
        else if (this.isWall) {
            return "rgba(25, 25, 25, 0.8)";
        }

        return "rgba(100, 50, 150, 0.4)";
    }
};


const _createCanvas = () => {
    const body = document.querySelector("body");
    const canvas = document.createElement("canvas");
    canvas.setAttribute("id", "theGame");
    canvas.setAttribute("width", canvasWidth);
    canvas.setAttribute("height", canvasHeight);
    body.appendChild(canvas);
};


let grid = [];


const _createGrid = () => {
    for (var x = 0; x < canvasWidth / gridChunkSize; x++) {
        grid[x] = [];
        for (var y = 0; y < canvasHeight / gridChunkSize; y++) {
            grid[x][y] = new GridSquare({x: x, y: y});
        }
    }
};


_createCanvas();
_createGrid()


const canvas = document.getElementById("theGame");
const ctx = canvas.getContext("2d");


const draw = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (var x = 0; x < grid.length; x++) {
        for (var y = 0; y < grid[0].length; y++) {
            let gridSquare = grid[x][y];
            gridSquare.draw();
        }
    }
};


const _getGridSquare = (x, y) => {
    const xChunk = Math.floor(x / gridChunkSize);
    const yChunk = Math.floor(y / gridChunkSize);
    return grid[xChunk][yChunk];
};


const setPropertyForOne = (gridSquare, propName) => {
    for (var x = 0; x < grid.length; x++) {
        for (var y = 0; y < grid[0].length; y++) {
            grid[x][y][propName] = false;
        }
    }

    gridSquare[propName] = true;
};


const addButtons = () => {
    const buttons = [{
        text: "Start",
        class: "clickMode",
        clickMode: "start"
    }, {
        text: "Wall",
        class: "clickMode",
        clickMode: "wall"
    }, {
        text: "Target",
        class: "clickMode",
        clickMode: "target"
    }, {
        text: "Find Path",
        class: "findPath"
    }];

    buttons.forEach(addButton);
};


const addButton = (button) => {
    let buttonEl = document.createElement("button");
    let buttonText = document.createTextNode(button.text);
    buttonEl.appendChild(buttonText);
    buttonEl.setAttribute("class", button.class);
    buttonEl.dataset.clickMode = button.clickMode;
    document.querySelector('body').appendChild(buttonEl);
    buttonEl.addEventListener("click", function (e) {
        if (e.target.className === 'clickMode') {
            clickMode = e.target.dataset.clickMode;
            return;
        }
        
        findPath();
    })
};


const findNode = (nodeType) => {
    let matchingNodes = [];

    for (var x = 0; x < grid.length; x++) {
        for (var y = 0; y < grid[0].length; y++) {
            if (grid[x][y][nodeType] === true) {
                matchingNodes.push(grid[x][y]);
            }
        }
    }

    return matchingNodes;
};


const getDistance = (cellA, cellB) => {
    let dx = Math.abs(cellA.x - cellB.x);
    let dy = Math.abs(cellA.y - cellB.y);

    let min = Math.min(dx, dy);
    let max = Math.max(dx, dy);

    let diagonalSteps = min;
    let straightSteps = max - min;

    return (diagonalSteps * 14) + (straightSteps * 10);
};


const findPath = () => {
    let start = findNode("isStart")[0];
    let target = findNode("isTarget")[0];

    let open = []; // the set of nodes to be evaluated
    let closed = []; // the set of nodes already evaluated

    // add the start node to open
    open.push(start);

    let inList = (list, node) => {
        return list.some((listNode) => listNode.x === node.x && listNode.y === node.y);
    };

    // loop
    let gameLoop = window.setInterval(function () {
        draw();

        // current = node in open with the lowest f_cost
        let current = open.reduce((minF, node) => node.costs.f < minF ? node.costs.f : minF, open[0]);

        console.log("current", current);

        // remove current from open
        open = open.filter((node) => node.x !== current.x && node.y !== current.y);
        console.log("open", open);

        // add current to closed
        closed.push(current);
        
        // if current is the target node, path has been found, return
        if (current.x === target.x && current.y === target.y) {
            window.clearInterval(gameLoop);
            while (current.parent) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.fillRect(current.x * gridChunkSize, current.y * gridChunkSize, gridChunkSize, gridChunkSize);
                current = current.parent;
            }
            return;
        }
        
        // foreach neighbour of the current node
        current.getAdjacent().forEach((neighbour) => {
            // if neighbour is not traversable or neighbour is in closed, skip to next neighbour
            if (neighbour.isWall || inList(closed, neighbour)) {
                return;
            }

            // if new path to neighbour is shorter or neighbour is not in open
            if (!inList(open, neighbour)) {
                neighbour.costs.g = getDistance(neighbour, start);
                neighbour.costs.h = getDistance(neighbour, target);
                neighbour.costs.f = neighbour.costs.g + neighbour.costs.h;
                neighbour.parent = current;
                open.push(neighbour);
            }
        });
    }, 250);
};


draw();
addButtons();

let clickMode = 'start';

canvas.addEventListener("click", function (e) {
    const gridSquare = _getGridSquare(e.offsetX, e.offsetY);
    
    if (!gridSquare) return;
    if ((clickMode === "start" || clickMode === "target") && gridSquare.isWall) return;

    switch (clickMode) {
        case "start": setPropertyForOne(gridSquare, 'isStart'); break;
        case "wall": gridSquare.isWall = !gridSquare.isWall; break;
        case "target": setPropertyForOne(gridSquare, 'isTarget'); break;
    }

    draw();
});