AFRAME.registerComponent("board", {
    schema: {
        chessBoardColumns: {type: "array", default: ["a", "b", "c", "d", "e", "f", "g", "h"]},
        chessBoardRows: {type: "array", default: [8, 7, 6, 5, 4, 3, 2, 1]}
    },
    init: function () {
        // start by removing all child nodes; seems that this is the fastest way
        while (this.el.lastChild) {
            this.el.removeChild(this.el.lastChild);
        }
        // add the tiles
        this._drawBoard(0.2, 0.2);

        this._createPieces();
        // initialize the CHESSBOARD object
        CHESSBOARD.initChessBoard();
    },
    _drawBoard: function (width, depth) {
        let self = this;
        self.data.chessBoardColumns.forEach(function (col, colIndex) {
            self.data.chessBoardRows.forEach(function (row, rowIndex) {
                // color of the new tile is easily determined; if row and column index are both even or odd, then it's white; else it's black
                let color = (rowIndex % 2 === colIndex % 2 ? "white" : "black");
                // create the new element in the dom
                let el = document.createElement("a-entity");
                el.setAttribute("geometry", "primitive: box; height: 0.05; width: " + width + "; depth: " + depth);
                // set the id of the new element : "sqa1", "sqc7", ...
                el.id = "sq" + col + row;
                // declare that the new element has the tile component
                el.setAttribute("tile", "name:" + el.id + ";color:" + color);
                // position is conveniently calculated based on the column and row index
                el.setAttribute("position", (colIndex * width - 4 * width) + " 0 " + (rowIndex * depth - 4 * depth));
                // add the element to the board element
                self.el.appendChild(el);
            });
        });
    },
    _createPieces: function () {
        let self = this;
        [8, 7, 2, 1].forEach(function (row) {
            let color = (row >= 7 ? "black" : "white");
            self.data.chessBoardColumns.forEach(function (col, colIndex) {
                if (row === 7 || row === 2) {
                    self._createPiece(color, "pawn", col + row);
                } else {
                    switch (col) {
                    case "a":
                    case "h":
                        self._createPiece(color, "rook", col + row);
                        break;
                    case "b":
                    case "g":
                        self._createPiece(color, "knight", col + row);
                        break;
                    case "c":
                    case "f":
                        self._createPiece(color, "bishop", col + row);
                        break;
                    case "d":
                        self._createPiece(color, (row === 8 ? "queen" : "king"), col + row);
                        break;
                    case "e":
                        self._createPiece(color, (row === 8 ? "king" : "queen"), col + row);
                        break;
                    }
                }
            });
        });
    },
    _createPiece: function (color, type, position) {
        let el = document.createElement("a-entity");
        // declare that the new element has the piece component
        el.setAttribute("piece", "type:" + type + ";color:" + color + ";boardPosition:" + position);
        // add the element to the board element
        try {
            let tile = document.querySelector("#sq" + position);
            tile.appendChild(el);
        } catch (e) {
            console.log(">> _createPiece > Error during appendItem > " + el.id + " / " + position + " > " + e);
        }
    }
});

AFRAME.registerComponent("my-custom", {
    schema: {
        dashSize: {default: 3},
        lineWidth: {default: 1}
    },

    /**
     * Creates a new THREE.ShaderMaterial using the two shaders defined
     * in vertex.glsl and fragment.glsl.
     */
    init: function () {
        var material = new THREE.MeshToonMaterial({
            shininess: 1.0
        });
        this.material = material;

        this.update();
        // this.el.addEventListener("model-loaded", () => this.applyToMesh());
    },

    /**
     * Update the ShaderMaterial when component data changes.
     */
    update: function () {
        this.material.dashsize = this.data.dashsize;
        this.material.linewidth = this.data.linewidth;
    }
});

const vertexShader = `
// vertex.glsl

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const fragmentShader = `
// fragment.glsl

varying vec2 vUv;
uniform vec3 color;
uniform float time;

void main() {
  // Use sin(time), which curves between 0 and 1 over time,
  // to determine the mix of two colors:
  //    (a) Dynamic color where 'R' and 'B' channels come
  //        from a modulus of the UV coordinates.
  //    (b) Base color.
  //
  // The color itself is a vec4 containing RGBA values 0-1.
  gl_FragColor = mix(
    vec4(mod(vUv , 0.05) * 20.0, 1.0, 1.0),
    vec4(color, 1.0),
    sin(time)
  );
}`;

AFRAME.registerComponent("material-grid-glitch", {
    schema: {
        color: {type: "color"}
    },

    /**
     * Creates a new THREE.ShaderMaterial using the two shaders defined
     * in vertex.glsl and fragment.glsl.
     */
    init: function () {
        const data = this.data;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                color: { value: new THREE.Color(data.color) }
            },
            vertexShader,
            fragmentShader
        });

        this.applyToMesh();
        this.el.addEventListener("model-loaded", () => this.applyToMesh());
    },

    /**
     * Update the ShaderMaterial when component data changes.
     */
    update: function () {
        this.material.uniforms.color.value.set(this.data.color);
    },

    /**
     * Apply the material to the current entity.
     */
    applyToMesh: function () {
        const mesh = this.el.getObject3D("mesh");
        if (mesh) {
            mesh.material = this.material;
        }
    },

    /**
     * On each frame, update the 'time' uniform in the shaders.
     */
    tick: function (t) {
        this.material.uniforms.time.value = t / 1000;
    }

});

AFRAME.registerComponent("tile", {
    schema: {
        // name: tile name
        name: {type: "string", default: ""},
        // color: white|black
        color: {type: "string", default: ""}
    },
    init: function () {
        this.el.setAttribute("mixin", "tile");
        this.el.setAttribute("material", "color: " + this.data.color);
    }
});

AFRAME.registerComponent("piece", {
    schema: {
        // type: pawn / rook / bishop / knight / queen / king
        type: {type: "string", default: ""},
        // boardPosition: current tile name the piece is on
        boardPosition: {type: "string", default: ""},
        // color: white|black
        color: {type: "string", default: ""},
        // up position: -0.5
        upPosition: {type: "number", default: -0.5},
        // down position: -0.1
        downPosition: {type: "number", default: -2},
        // used by forcePush
        force: { default: 10 }
    },
    init: function () {
        // set the id of the new element : "bpawnf", "wqueen", ...
        this.el.id = this.data.color[0] + this.data.type + (this.data.type !== "queen" && this.data.type !== "king" ? this.data.boardPosition[0] : "");

        // use the mixins : [white|black][pawn|rook|knight|bishop|queen|king] piece
        this.el.setAttribute("mixin", this.data.color + this.data.type + " piece pickedup-anim");

        // set rotation of the piece
        this.el.setAttribute("rotation", this.data.initRotationX + " " + this.data.initRotationY + " " + this.data.initRotationZ);
    },
    update: function () {
    },
    updateSchema: function (data) {
        let tempSchema = {};
        tempSchema.initRotationX = {type: "number", default: 0};
        tempSchema.initRotationZ = {type: "number", default: 0};
        // if piece is white then flip it
        if (data.color === "white") {
            tempSchema.initRotationY = {type: "number", default: 180};
        } else {
            tempSchema.initRotationY = {type: "number", default: 0};
        }
        this.extendSchema(tempSchema);
    }
});
