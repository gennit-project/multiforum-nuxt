const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

// First, let's try with the simple approach but with better GLB construction
const parseSTL = require('parse-stl');

class ImprovedGLBCreator {
  static calculateBounds(vertices) {
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];
    
    for (let i = 0; i < vertices.length; i += 3) {
      min[0] = Math.min(min[0], vertices[i]);
      min[1] = Math.min(min[1], vertices[i + 1]);
      min[2] = Math.min(min[2], vertices[i + 2]);
      
      max[0] = Math.max(max[0], vertices[i]);
      max[1] = Math.max(max[1], vertices[i + 1]);
      max[2] = Math.max(max[2], vertices[i + 2]);
    }
    
    return { min, max };
  }

  static createGLB(positions, normals) {
    const positionArray = new Float32Array(positions);
    const normalArray = new Float32Array(normals);
    
    // Calculate bounds
    const bounds = this.calculateBounds(positions);
    
    // Create index buffer for better efficiency
    const numVertices = positions.length / 3;
    const indices = new Uint16Array(numVertices);
    for (let i = 0; i < numVertices; i++) {
      indices[i] = i;
    }
    
    // Prepare binary data
    const indexBuffer = indices.buffer;
    const positionBuffer = positionArray.buffer;
    const normalBuffer = normalArray.buffer;
    
    // Align buffers to 4-byte boundaries
    const indexPadding = (4 - (indexBuffer.byteLength % 4)) % 4;
    const positionPadding = (4 - (positionBuffer.byteLength % 4)) % 4;
    const normalPadding = (4 - (normalBuffer.byteLength % 4)) % 4;
    
    // Create combined binary buffer
    const binaryLength = indexBuffer.byteLength + indexPadding + 
                        positionBuffer.byteLength + positionPadding + 
                        normalBuffer.byteLength + normalPadding;
    
    const binaryBuffer = new ArrayBuffer(binaryLength);
    const binaryView = new Uint8Array(binaryBuffer);
    
    let offset = 0;
    
    // Copy index data
    binaryView.set(new Uint8Array(indexBuffer), offset);
    offset += indexBuffer.byteLength + indexPadding;
    
    // Copy position data
    binaryView.set(new Uint8Array(positionBuffer), offset);
    offset += positionBuffer.byteLength + positionPadding;
    
    // Copy normal data
    binaryView.set(new Uint8Array(normalBuffer), offset);
    
    // Create glTF JSON
    const gltf = {
      asset: {
        version: "2.0",
        generator: "STL to GLB converter"
      },
      scene: 0,
      scenes: [{
        nodes: [0]
      }],
      nodes: [{
        mesh: 0
      }],
      meshes: [{
        primitives: [{
          attributes: {
            POSITION: 1,
            NORMAL: 2
          },
          indices: 0,
          mode: 4 // TRIANGLES
        }]
      }],
      buffers: [{
        byteLength: binaryLength
      }],
      bufferViews: [
        {
          buffer: 0,
          byteOffset: 0,
          byteLength: indexBuffer.byteLength,
          target: 34963 // ELEMENT_ARRAY_BUFFER
        },
        {
          buffer: 0,
          byteOffset: indexBuffer.byteLength + indexPadding,
          byteLength: positionBuffer.byteLength,
          target: 34962 // ARRAY_BUFFER
        },
        {
          buffer: 0,
          byteOffset: indexBuffer.byteLength + indexPadding + positionBuffer.byteLength + positionPadding,
          byteLength: normalBuffer.byteLength,
          target: 34962 // ARRAY_BUFFER
        }
      ],
      accessors: [
        {
          bufferView: 0,
          byteOffset: 0,
          componentType: 5123, // UNSIGNED_SHORT
          count: indices.length,
          type: "SCALAR",
          max: [numVertices - 1],
          min: [0]
        },
        {
          bufferView: 1,
          byteOffset: 0,
          componentType: 5126, // FLOAT
          count: numVertices,
          type: "VEC3",
          max: bounds.max,
          min: bounds.min
        },
        {
          bufferView: 2,
          byteOffset: 0,
          componentType: 5126, // FLOAT
          count: numVertices,
          type: "VEC3",
          max: [1.0, 1.0, 1.0],
          min: [-1.0, -1.0, -1.0]
        }
      ]
    };
    
    // Convert JSON to buffer
    const jsonString = JSON.stringify(gltf);
    const jsonBuffer = Buffer.from(jsonString);
    
    // Pad JSON to 4-byte boundary
    const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
    const jsonLength = jsonBuffer.length + jsonPadding;
    
    // Calculate total file size
    const totalSize = 12 + // GLB header
                     8 + jsonLength + // JSON chunk header + data
                     8 + binaryLength; // Binary chunk header + data
    
    // Create GLB file
    const glb = Buffer.alloc(totalSize);
    let glbOffset = 0;
    
    // Write GLB header
    glb.writeUInt32LE(0x46546C67, glbOffset); glbOffset += 4; // magic "glTF"
    glb.writeUInt32LE(2, glbOffset); glbOffset += 4; // version
    glb.writeUInt32LE(totalSize, glbOffset); glbOffset += 4; // total length
    
    // Write JSON chunk
    glb.writeUInt32LE(jsonLength, glbOffset); glbOffset += 4; // chunk length
    glb.writeUInt32LE(0x4E4F534A, glbOffset); glbOffset += 4; // chunk type "JSON"
    jsonBuffer.copy(glb, glbOffset); glbOffset += jsonBuffer.length;
    glbOffset += jsonPadding; // skip padding
    
    // Write binary chunk
    glb.writeUInt32LE(binaryLength, glbOffset); glbOffset += 4; // chunk length
    glb.writeUInt32LE(0x004E4942, glbOffset); glbOffset += 4; // chunk type "BIN\0"
    Buffer.from(binaryBuffer).copy(glb, glbOffset);
    
    return glb;
  }
}

exports.convertSTLtoGLB = async (event, context) => {
  
  try {
    const data = JSON.parse(Buffer.from(event.data, 'base64').toString());
    const bucketName = data.bucket;
    const fileName = data.name;
    
    if (!fileName.toLowerCase().endsWith(".stl")) {
      return;
    }


    // Download STL file
    const [stlBuffer] = await storage.bucket(bucketName).file(fileName).download();

    // Parse STL
    const mesh = parseSTL(stlBuffer);

    // Create flat arrays for positions and normals
    const positions = [];
    const normals = [];
    
    // Process each face
    for (let i = 0; i < mesh.cells.length; i++) {
      const face = mesh.cells[i];
      
      // Get vertices
      const v0 = mesh.positions[face[0]];
      const v1 = mesh.positions[face[1]];
      const v2 = mesh.positions[face[2]];
      
      // Calculate normal
      const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
      const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
      
      const nx = edge1[1] * edge2[2] - edge1[2] * edge2[1];
      const ny = edge1[2] * edge2[0] - edge1[0] * edge2[2];
      const nz = edge1[0] * edge2[1] - edge1[1] * edge2[0];
      
      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const normal = len > 0 ? [nx/len, ny/len, nz/len] : [0, 0, 1];
      
      // Add vertices and normals for this triangle
      positions.push(...v0, ...v1, ...v2);
      normals.push(...normal, ...normal, ...normal);
    }

    // Create GLB
    const glbBuffer = ImprovedGLBCreator.createGLB(positions, normals);
    
    // Upload GLB
    const glbFileName = fileName.replace(/\.stl$/i, '.glb');
    await storage
      .bucket(bucketName)
      .file(glbFileName)
      .save(glbBuffer, {
        metadata: {
          contentType: 'model/gltf-binary',
          cacheControl: 'public, max-age=31536000'
        }
      });

    
    return {
      success: true,
      message: `Converted ${fileName} to ${glbFileName}`,
      size: glbBuffer.length
    };
    
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
};